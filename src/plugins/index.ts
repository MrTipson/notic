import * as runtime from 'react/jsx-runtime';
import { EvaluateOptions } from "@mdx-js/mdx";
import React, { JSXElementConstructor } from 'react';
import { funregHelper } from '@/utils';
import { createPortal } from 'react-dom';
import { compile as compileMdx, evaluate as evaluateMdx } from '@mdx-js/mdx';
import { exists, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { appCacheDir, normalize } from '@tauri-apps/api/path';
import { convertFileSrc, invoke } from '@tauri-apps/api/core';

const remarkPatchImportsOptions: { compileQueue: string[] } = { compileQueue: [] };
export function remarkPatchImports() {
    return async function (tree: any) {
        const queue = remarkPatchImportsOptions.compileQueue;
        let workdir;
        if (queue.length === 0) {
            workdir = undefined;
        } else {
            const last = queue.length - 1;
            workdir = queue[last].substring(0, queue[last].lastIndexOf('/') + 1);
        }

        for (const decl of tree.body) {
            if (decl.type === 'ImportDeclaration') {
                const url: string = decl.source.value;
                if (url.startsWith('./') || url.startsWith('../')) {
                    const path = await normalize(workdir + url);
                    if (path in queue) {
                        remarkPatchImportsOptions.compileQueue = [];
                        throw Error('Patch imports: infinite recursion detected');
                    }
                    remarkPatchImportsOptions.compileQueue.push(path);

                    decl.source.raw = `"${convertFileSrc(await compile(path))}"`;
                } else if (url.startsWith('/')) {
                    const path = await normalize(url);
                    if (path in queue) {
                        remarkPatchImportsOptions.compileQueue = [];
                        throw Error('Patch imports: infinite recursion detected');
                    }
                    remarkPatchImportsOptions.compileQueue.push(path);
                    decl.source.raw = `"${convertFileSrc(await compile(path))}"`;
                }
            }
        }
        remarkPatchImportsOptions.compileQueue.pop();
    }
}

// TODO: properly merge properties in EvaluateOptions
function constructOptions(imported: NoticPlugin[]): Readonly<EvaluateOptions> {
    return {
        ...runtime,

        recmaPlugins: ([remarkPatchImports] as any[]).concat(...imported.map(p => p?.options?.recmaPlugins || [])),
        rehypePlugins: ([] as any[]).concat(...imported.map(p => p?.options?.rehypePlugins || [])),
        remarkPlugins: ([] as any[]).concat(...imported.map(p => p?.options?.remarkPlugins || [])),
    };
}

export interface PluginProps {
    id: string,
    registerAction: typeof funregHelper,
    tabIndex?: number,
    container?: HTMLDivElement,
    components: Map<string, PluginComponent>,
}
type PluginWrapperProps = {
    children: any,
    container?: HTMLDivElement,
}
export function PluginWrapper({ children, container }: PluginWrapperProps) {
    return container ? createPortal(children, container) : children;
}
export type PluginComponent = JSXElementConstructor<PluginProps>
export type PluginApi = ReturnType<typeof pluginApi>
type ApplyFn = (args: {
    api: PluginApi,
    filename: string | undefined,
    props: { [key: string]: unknown }
}) => Promise<void>;
export type NoticPlugin = {
    title: string,
    description: string,
    dependencies?: readonly string[],
    options?: Partial<EvaluateOptions>,
    apply?: ApplyFn,
    uiComponents?: { [index: string]: PluginComponent },
    mdxComponents?: { [index: string]: React.ReactElement },
};

export type NoticPluginWithId = NoticPlugin & { id: string }
const loaded = {
    imported: [] as NoticPluginWithId[],
    options: constructOptions([]),
};
export async function importPlugins(plugins: string[]) {
    let ps = new Map<string, NoticPlugin>(await Promise.all<any>(plugins.map(async p => [p, await import(`./${p}/index.tsx`)])));
    // Find plugins that are depended on but not manually imported
    for (const [_k, v] of ps) {
        if (v.dependencies) {
            for (const name of v.dependencies) {
                if (name in ps) continue;
                ps.set(name, await import(`./${name}/index.tsx`));
            }
        }
    }
    // Make sure plugins are after their dependencies
    let imported: NoticPluginWithId[] = [];
    while (ps.size > 0) {
        for (const [k, v] of ps) {
            if (!v.dependencies || v.dependencies.every(x => !(x in ps))) {
                imported.push({ ...v, id: k });
                ps.delete(k);
            }
        }
    }
    loaded.options = constructOptions(imported);
    loaded.imported = imported;
    return loaded;
}

function pluginApi(_options: Readonly<EvaluateOptions>) {
    return Object.freeze({
        evaluate: loadMdx,
    });
}

const prodHeader = `import { j } from "tauri://localhost/assets/react.js";\nconst { Fragment: _Fragment, jsx: _jsx, jsxs: _jsxs } = j;`;
const devHeader = `import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "https://esm.sh/react/jsx-runtime";`;
const header = import.meta.env.PROD ? prodHeader : devHeader;
export async function render(filename: string | undefined, content: string) {
    // App.tsx makes sure plugins get reimported
    const { imported, options } = loaded;
    if (filename !== undefined) {
        var { default: MDXContent, ...props } = await loadMdx(filename);
    } else {
        var { default: MDXContent, ...props } = await evaluateMdx(content, options);
    }

    const args = {
        filename, props,
        api: pluginApi(options),
    };
    for (let i = 0; i < imported.length; i++) {
        const plugin = imported[i];
        if (plugin.apply) {
            await plugin.apply(args);
        }
    }
    console.log(props);
    return MDXContent(props);
}

async function compile(filename: string): Promise<string> {
    const sha = await invoke('sha256', { content: filename });
    const path = `${await appCacheDir()}/${sha}.js`;

    if (!await exists(path) || true) {
        const content = await readTextFile(filename);
        remarkPatchImportsOptions.compileQueue.push(filename);
        const result = await compileMdx(content, { ...loaded.options, jsx: false });
        const text = String(result.value)

        await writeTextFile(path, header + text.substring(text.indexOf("\n")));
    }
    return path;
}

async function loadMdx(filename: string): ReturnType<typeof evaluateMdx> {
    return import(/* @vite-ignore */ convertFileSrc(await compile(filename)))
        .catch(reason => { console.log("Dynamic import error", reason) })
}

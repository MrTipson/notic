import * as runtime from 'react/jsx-runtime';
import { evaluate } from '@mdx-js/mdx';
import { EvaluateOptions } from "@mdx-js/mdx";
import { readTextFile } from '@tauri-apps/plugin-fs';
import { JSXElementConstructor } from 'react';
import { funregHelper } from '@/utils';
import { createPortal } from 'react-dom';

function constructOptions(imported: NoticPlugin[]): Readonly<EvaluateOptions> {
    return {
        ...runtime,
        remarkPlugins: ([] as any[]).concat(...imported.map(p => p?.options?.remarkPlugins || [])),
    };
}

export interface PluginProps {
    id: string,
    registerAction: typeof funregHelper,
    tabIndex?: number,
    container: HTMLDivElement | null,
    components: Map<string, PluginComponent>,
}
type PluginWrapperProps = {
    children: any,
    container: HTMLDivElement | null,
}
export function PluginWrapper({ children, container }: PluginWrapperProps) {
    return container ? createPortal(children, container) : children;
}
export type PluginComponent = JSXElementConstructor<PluginProps>
export type PluginApi = ReturnType<typeof pluginApi>
type ApplyFn = (args: {
    api: PluginApi,
    filename: string | undefined,
    props: {[key: string]: unknown}
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
    for (const [_k,v] of ps) {
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
        for (const [k,v] of ps.entries()) {
            if (!v.dependencies || v.dependencies.every(x => !(x in ps))) {
                imported.push({...v, id: k});
                ps.delete(k);
            }
        }
    }
    loaded.options = constructOptions(imported);
    loaded.imported = imported;
    return loaded;
}

export async function render(filename: string | undefined, content: string) {
    // App.tsx makes sure plugins get reimported
    const { imported, options } = loaded;
    const { default: MDXContent, ...props } = await evaluate(content, options);
    
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

function pluginApi(options: Readonly<EvaluateOptions>) {
    return Object.freeze({
        evaluate: async (filename: string) => evaluate(await readTextFile(filename), options),
    });
}
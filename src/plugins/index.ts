import * as runtime from 'react/jsx-runtime';
import { evaluate } from '@mdx-js/mdx';
import { EditorState } from '@/Editor';
import { EvaluateOptions } from "@mdx-js/mdx";
import { readTextFile } from '@tauri-apps/plugin-fs';

function constructOptions(imported: NoticPlugin[]): Readonly<EvaluateOptions> {
    return {
        ...runtime,
        remarkPlugins: ([] as any[]).concat(...imported.map(p => p?.options?.remarkPlugins || [])),
    };
}

type PluginApi = ReturnType<typeof pluginApi>
export type NoticPlugin = {
    title: string,
    description: string,
    dependencies?: readonly string[],
    options?: Partial<EvaluateOptions>,
    apply?: (api: PluginApi, props: {[key: string]: unknown}) => Promise<void>,
};

let memo: string[] = [];
const old = {
    imported: [] as NoticPlugin[],
    options: constructOptions([]),
};
async function importPlugins(plugins: string[]) {
    if (plugins !== memo) {
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
        let imported: NoticPlugin[] = [];
        while (ps.size > 0) {
            for (const [k,v] of ps.entries()) {
                if (!v.dependencies || v.dependencies.every(x => !(x in ps))) {
                    imported.push(v);
                    ps.delete(k);
                }
            }
        }
        old.options = constructOptions(imported);
        memo = plugins;
        old.imported = imported;
    }
    return old;
}

export async function render(state: EditorState) {
    const { content, plugins } = state;
    const { imported, options } = await importPlugins(plugins);

    const { default: MDXContent, ...props } = await evaluate(content, options);
    
    const api = pluginApi(state, options);
    for (let i = 0; i < imported.length; i++) {
        const plugin = imported[i];
        if (plugin.apply) {
            await plugin.apply(api, props);
        }
    }
    console.log(props);
    return MDXContent(props);
}

function pluginApi(state: EditorState, options: Readonly<EvaluateOptions>) {
    const { dir } = state;
    return Object.freeze({
        evaluate: async (filename: string) => evaluate(await readTextFile(dir + filename), options),
    });
}
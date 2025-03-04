import * as runtime from 'react/jsx-runtime';
import { evaluate } from '@mdx-js/mdx';
import { EditorState } from '@/Editor';
import { EvaluateOptions } from "@mdx-js/mdx";
import { readTextFile } from '@tauri-apps/plugin-fs';

function constructOptions(imported: NoticPlugin[]) {
    return {
        ...runtime,
        remarkPlugins: ([] as any[]).concat(...imported.map(p => p?.options?.remarkPlugins || [])),
    };
}

type PluginApi = ReturnType<typeof pluginApi>
export type NoticPlugin = {
    title: string,
    description: string,
    options?: Partial<EvaluateOptions>,
    apply?: (api: PluginApi, props: {[key: string]: unknown}) => Promise<void>,
};

let memo: string[] = [];
let imported: Readonly<NoticPlugin>[] = [];
let options = constructOptions(imported);

export async function render(state: EditorState) {
    const { content, plugins, dir } = state;
    if (plugins !== memo) {
        memo = plugins;
        imported = await Promise.all(plugins.map(p => import(`./${p}/index.tsx`)));
        options = constructOptions(imported);
    }

    const { default: MDXContent, ...props } = await evaluate(content, options);
    
    const api = pluginApi(state);
    for (let i = 0; i < imported.length; i++) {
        const plugin = imported[i];
        if (plugin.apply) {
            await plugin.apply(api, props);
        }
    }
    console.log(props);
    return MDXContent(props);
}

function pluginApi(state: EditorState) {
    const { dir } = state;
    return Object.freeze({
        evaluate: async (filename: string) => evaluate(await readTextFile(dir + filename), options),
    });
}
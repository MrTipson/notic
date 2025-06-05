import { ReactNode } from "react";
import { PluginProps } from "..";
import { generateSplitId } from "./Split";

export type SplitPane = {
    a: SplitPane | SimplePane,
    b: SplitPane | SimplePane,
    id: string,
    ratio: number,
    direction: 'horizontal' | 'vertical',
}
export type SimplePane = {
    a: ReactNode,
}
export type ComponentConfig = {
    name: string,
    id: string,
    tabIndex: number,
    container: HTMLDivElement | null,
}
export function parseConfig(props: PluginProps, mountedComponents: {[index: string]: ComponentConfig}, layout: string) {
    return _parseConfig(props, mountedComponents, {
        layout: layout.split(' '),
        i: 0,
        tabIndex: 1,
    });
}
function _parseConfig(props: PluginProps, mountedComponents: {[index: string]: ComponentConfig}, args: { layout: string[], i: number, tabIndex: number }): SplitPane | SimplePane {
    const { layout, i, tabIndex } = args;
    if (layout[i] === 'h' || layout[i] === 'v') {
        let ratio;
        try {
            ratio = parseFloat(layout[i+1]);
        } catch (e) {
            throw new Error('Got ' + layout[i+1] + ' when parsing split, expected ratio')
        }
        args.i += 2;
        return {
            direction: layout[i] === 'h' ? 'horizontal' : 'vertical',
            a: _parseConfig(props, mountedComponents, args),
            b: _parseConfig(props, mountedComponents, args),
            id: generateSplitId(),
            ratio
        };
    } else {
        let name, id;
        try {
            [name, id] = layout[i].split('#');
        } catch (e) {
            throw new Error('Expected component, found ' + layout[0]);
        }
        args.tabIndex += 1;
        args.i += 1;
        return { a: <div className='h-full w-full' ref={el => {mountedComponents[layout[i]] = { name, id, tabIndex, container: el };}}/> };
    }
}
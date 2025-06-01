import { useState } from "react";
import { PluginProps } from "..";
import { Split } from "./Split";

export default function Layout(props: PluginProps) {
    const { components } = props;
    const [children, setChildren] = useState<string[]>(['file-browser#default', 'editor#default', 'preview#default']);

    const tmp = children.map((x, i) => {
        const [name, id] = x.split('#');
        const Component = components.get(name) || (() => `Component ${x} not found`);

        return <Component {...{...props, id, tabIndex: i}}/>;
    });

    const c = <Split type='horizontal' a={tmp[0]} b={tmp[1]} />;
    return (
        <div className='h-full w-full flex'>
            <Split type='vertical' a={c} b={tmp[2]} />
        </div>
    );
}


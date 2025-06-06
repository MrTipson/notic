import { MouseEventHandler, ReactNode, RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PluginProps } from "..";
import { ComponentConfig, parseConfig, SimplePane, SplitPane } from "./config";
import { Split, generateSplitId } from "./Split";

export default function Layout(props: PluginProps) {
    const [mountedComponents, setMountedComponents] = useState<{[index: string]: ComponentConfig}>({});
    const initialConfig = useMemo(() => parseConfig(props, mountedComponents, 'h 0.15 file-browser#default v 0.5 editor#default preview#default'), [])
    const layoutConfigRef = useRef<SplitPane | SimplePane>(initialConfig);

    const containerRef = useRef<HTMLDivElement>(null);
    const containerRect = useMemo(() => {
        const c = containerRef.current;
        if (!c) return undefined;
        return { left: c.clientLeft, top: c.clientTop, width: c.clientWidth, height: c.clientHeight }
    }, [containerRef.current, window.innerWidth, window.innerHeight]);

    const [floating, setFloating] = useState<ReactNode>();

    // When floating state changes, react needs 1 update to update refs, so we need another one for portals to work
    const [doubleRefresh, setDoubleRefresh] = useState(false);
    useEffect(() => setDoubleRefresh(!doubleRefresh), [floating]);


    const [dryRunOverlay, setDryRunOverlay] = useState<{ left: number, top: number, width: number, height: number }>();

    const onMouseMove = useCallback<MouseEventHandler>(event => {
        if (!floating || !containerRect) return;
        setDryRunOverlay(putDown(layoutConfigRef, { ...containerRect, x: event.clientX, y: event.clientY }, floating, true))
    }, [floating]);
    const onMouseDown = useCallback<MouseEventHandler>(event => {
        if (event.ctrlKey && event.button === 0) {
            if (!containerRect) return;
            const element = pickUp(layoutConfigRef, { ...containerRect, x: event.clientX, y: event.clientY });
            console.log('picking up', element);
            if (!!element) {
                setFloating(element);
                event.preventDefault();
            }
        }
    }, [setFloating, containerRect]);
    
    const onMouseUp = useCallback<MouseEventHandler>(event => {
        if (!containerRect || !floating) return;
        putDown(layoutConfigRef, { ...containerRect, x: event.clientX, y: event.clientY }, floating, false);
        console.log('putting down', floating);
        setFloating(null);
        setDryRunOverlay(undefined);
    }, [floating, setFloating]);

    console.log(mountedComponents)
    return (
        <div className='h-full w-full' onMouseDown={onMouseDown} onMouseUp={onMouseUp} onMouseMove={onMouseMove} ref={containerRef}>
            {createLayout(layoutConfigRef.current)}
            {dryRunOverlay && <div className='absolute bg-c1-accent/50 border-8 border-transparent' style={dryRunOverlay}/>}
            {Object.entries(mountedComponents).map(([k,{name, id, tabIndex, container}]) => {
                const Component = props.components.get(name) || (() => `Component ${name} not found`);
                return <Component key={k} {...{...props, id, tabIndex, container}}/>;
            })}
        </div>
    );
}

function createLayout(config: SplitPane | SimplePane) {
    if (!config) return;

    if ('direction' in config) {
        const { a, b } = config;
        return <Split key={config.id} config={config} a={createLayout(a)} b={createLayout(b)} />;
    } else {
        return config.a;
    }
}

type PaneHandlerArgs = { left: number, top: number, width: number, height: number, x: number, y: number };
function putDown(layoutConfigRef: RefObject<SplitPane | SimplePane | null>, args: PaneHandlerArgs, element: ReactNode, dryRun: boolean) {
    const { left, top, width, height } = args;
    if (!layoutConfigRef.current) {
        if (dryRun) {
            return { left, top, width, height};
        } else {
            layoutConfigRef.current = { a: element };
        }
        return;
    }

    const r = _putDown(layoutConfigRef.current, args, element, dryRun);
    if (!dryRun && r) {
        layoutConfigRef.current = r;
        return undefined;
    }
    return r;
}

function _putDown(current: SplitPane | SimplePane, args: PaneHandlerArgs, element: ReactNode, dryRun: boolean) {
    const { left, top, width, height, x, y } = args;
    const rel = { x: (x - left) / width, y: (y - top) / height };
    
    if ('direction' in current) {
        const [dir, notdir]: ('x' | 'y')[] = current.direction === 'horizontal' ? ['x', 'y'] : ['y', 'x'];
        if (Math.abs(current.ratio - rel[dir]) < 0.2 && (rel[notdir] < 0.1 || rel[notdir] > 0.9)) {
            // This case is the other way around, because we make a vertical split if its horizontal and vice versa 
            const [total, start]: (keyof PaneHandlerArgs)[] = dir === 'x' ? ['height', 'top'] : ['width', 'left'];
            if (dryRun) {
                const r = { left, top, width, height };
                r[total] /= 2;
                if (rel[notdir] > 0.9) {
                    r[start] += r[total];
                }
                return r;
            } else {
                const [a, b] = rel[notdir] < 0.1 ? [{ a: element }, current] : [current, { a: element }];
                return { a, b, ratio: 0.5, direction: dir === 'x' ? 'vertical' : 'horizontal', id: generateSplitId() };
            }
        } else {
            const [total, start]: (keyof PaneHandlerArgs)[] = dir === 'x' ? ['width', 'left'] : ['height', 'top'];
            let side: 'a' | 'b';
            if (rel[dir] < current.ratio) {
                side = 'a';
                args[total] *= current.ratio;
            } else {
                side = 'b';
                args[start] += args[total]*current.ratio;
                args[total] *= 1 - current.ratio;
            }
            const r: any = _putDown(current[side], args, element, dryRun);
            if (!dryRun && r) {
                current[side] = r as SplitPane | SimplePane;
                return undefined;
            }
            return r;
        }
    } else {
        const dist = { x: Math.abs(rel.x - 0.5), y: Math.abs(rel.y - 0.5) };
    
        const {dir, total, start}: {[index: string]: keyof PaneHandlerArgs} =
            dist.x > dist.y ? {dir:'x', total: 'width', start: 'left'} : {dir:'y', total: 'height', start: 'top'};
        if (dryRun) {
            const r = { left, top, height, width };
            r[total] /= 2;
            if (rel[dir] >= 0.5) {
                r[start] += r[total];
            }
            return r;
        } else {
            const [a, b] = rel[dir] < 0.5 ? [{ a: element }, current] : [current, { a: element }]
            return { ratio: 0.5, a, b, direction: dir === 'x' ? 'horizontal' : 'vertical', id: generateSplitId() };
        }
    }
}

function pickUp(layoutConfigRef: RefObject<SplitPane | SimplePane | null>, args: PaneHandlerArgs) {
    if (!layoutConfigRef.current) return;

    const current = layoutConfigRef.current;
    if ('direction' in current) {
        const found = _pickUp(current, args);
        if (found === current.a) {
            layoutConfigRef.current = current.b;
        } else if (found === current.b) {
            layoutConfigRef.current = current.a;
        }
        return found.a;
    } else {
        layoutConfigRef.current = null;
        return current.a;
    }
}

function _pickUp(current: SplitPane, args: PaneHandlerArgs): SimplePane {
    const [dir, total, start]: (keyof PaneHandlerArgs)[] =
        current.direction === 'horizontal' ? ['x', 'width', 'left'] : ['y', 'height', 'top'];
    
    const side = args[dir] <= args[start] + current.ratio * args[total] ? 'a' : 'b';

    if ('direction' in current[side]) {
        args[start] += current.ratio * args[total];
        args[total] *= 1 - current.ratio;
        return handleFound(current, side, _pickUp(current[side], args));
    } else {
        return current[side];
    }
}

// This is small wrapper to hide the type awkward way to handle rewriting of the leaf of the found pane
function handleFound(current: any, prop: 'a' | 'b', found: SimplePane): SimplePane {
    if (found === current[prop].a) {
        current[prop] = current[prop].b;
    } else if (found === current[prop].b) {
        current[prop] = current[prop].a;
    }
    return found;
}

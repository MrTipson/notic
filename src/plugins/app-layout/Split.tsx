import { StateSetter } from "@/utils";
import { MouseEventHandler, ReactNode, useCallback, useRef, useState } from "react";
import { SplitPane } from "./config";

type SplitProps = {
    a: ReactNode,
    b: ReactNode,
    config: SplitPane,
}

let id = 0;
export function generateSplitId() {
    return 'split' + id++;
}

export function Split(props: SplitProps) {
    const { a, b, config } = props;
    const type = config.direction;

    const [ratio, _setRatio] = useState(config.ratio);
    const setRatio = useCallback<typeof _setRatio>((update) =>
        _setRatio(current => {
            const nextState = typeof update === 'function' ? update(current) : update
            config.ratio = nextState;
            return nextState;
        })
        , [_setRatio])
    const [drag, setDrag] = useState(false);
    const me = useRef<HTMLDivElement>(null);

    const onMouseMove: MouseEventHandler = useCallback(event => {
        if (drag && !!me.current) {
            if (type === 'horizontal') {
                setRatio((event.clientX - me.current.clientLeft) / me.current.clientWidth);
            } else {
                setRatio((event.clientY - me.current.clientTop) / me.current.clientHeight);
            }
            event.preventDefault();
        }
    }, [drag, setRatio]);
    const onMouseUp: MouseEventHandler = useCallback(event => {
        if (!drag) return;
        if (event.type === 'mouseup' && event.button === 0 || event.type === 'mouseleave') {
            setDrag(false);
            // Magnetise edges a bit
            if (ratio < 0.05) setRatio(0);
            if (ratio > 0.95) setRatio(1);
        }
    }, [ratio, drag]);

    const flex = type === 'horizontal' ? 'flex' : 'flex flex-col';
    return (
        <div ref={me} className={'w-full h-full ' + flex} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
            <div className='shrink-0 min-w-0 min-h-0' style={{ flexBasis: ratio * 100 + '%' }}>{a}</div>
            <div className='grow relative overflow-visible min-h-0'>
                <div className={'h-full w-full relative ' + (type === 'vertical' ? 'overflow-auto' : '')}>{b}</div>
                <Divider {...{ drag, setDrag, type }} />
            </div>
        </div>
    );
}

interface DividerProps {
    drag: boolean,
    setDrag: StateSetter<boolean>,
    type: SplitPane['direction'],
}
function Divider(props: DividerProps) {
    const { type, drag, setDrag } = props;

    const onMouseDown: MouseEventHandler = useCallback((event) => {
        if (event.button === 0) {
            setDrag(true);
            event.preventDefault();
        }
    }, [setDrag]);

    let className = 'shrink-0 absolute p-4 from-transparent hover:via-c1-accent/50 to-transparent';
    if (type === 'horizontal') {
        className += ' h-full w-2 left-0 translate-x-[-50%] top-0 bg-gradient-to-r cursor-ew-resize';
    } else {
        className += ' w-full h-2 top-0 translate-y-[-50%] bg-gradient-to-b cursor-ns-resize';
    }
    if (drag) {
        className += ' via-c1-accent/50 from-45% to-55%';
        className += type === 'horizontal' ? ' w-100' : ' h-100';
    } else {
        className += ' from-25% to-75%';
    }
    return <div {...{ className, onMouseDown }} />;
}

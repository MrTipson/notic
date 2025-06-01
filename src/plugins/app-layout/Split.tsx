import { StateSetter } from "@/utils";
import { MouseEventHandler, ReactNode, useCallback, useRef, useState } from "react";

interface SplitProps {
    type: 'vertical' | 'horizontal',
    a: ReactNode,
    b: ReactNode,
}
export function Split(props: SplitProps) {
    const { type, a, b } = props;
    const [ratio, setRatio] = useState(0.3);
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
        if (event.button === 0) {
            setDrag(false);
        }
    }, [setRatio]);

    const flex = type === 'horizontal' ? 'flex' : 'flex flex-col';
    return (
        <div ref={me} className={'w-full h-full ' + flex} onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
            <div className='shrink-0 min-w-0 min-h-0' style={{ flexBasis: ratio*100 + '%' }}>{a}</div>
            <Divider {...{drag, setDrag, type}} />
            <div className={'grow ' + (type === 'vertical' ? 'overflow-auto' : '')}>{b}</div>
        </div>
    );
}

interface DividerProps {
    drag: boolean,
    setDrag: StateSetter<boolean>,
    type: SplitProps['type'],
}
function Divider(props: DividerProps) {
    const { type, drag, setDrag } = props;

    const onMouseDown: MouseEventHandler = useCallback((event) => {
        if (event.button === 0) {
            setDrag(true);
            event.preventDefault();
        }
    }, [setDrag]);

    let className = 'hover:bg-c1-accent shrink-0 ' +
        (type === 'horizontal' ? 'h-full w-2' : 'w-full h-2');
    if (drag) {
        className += ' bg-c1-accent';
    }
    return <div {...{className, onMouseDown}}/>;
}

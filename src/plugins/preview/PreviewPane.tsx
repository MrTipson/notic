import { useRef, useState } from "react";
import ErrorBoundary from "./ErrorBoundary";
import { StateSetter } from "@/utils";
import { PluginProps, PluginWrapper, render } from "@/plugins";
import { wrap } from "@/hooks/wrappedState";


async function tryRender(state: PreviewState, filename: string | undefined, content: string) {
    const { rendered, setRendered, setOldRendered, error, setError } = state;
    try {
        setRendered(await render(filename, content));
        if (!error) setOldRendered(rendered);
        state.boundaryRef.current?.reset();
        setError('');
        // console.log("frontmatter", frontmatter)
    } catch (error: any) {
        console.log(error);
        setError(error);
    }
}

async function printFile(_state: PreviewState) {
    window.print();
}

export type PreviewState = {

    rendered: any,
    oldRendered: any,
    error: string,

    boundaryRef: React.RefObject<ErrorBoundary | null>,

    setRendered: StateSetter<PreviewState['rendered']>,
    setOldRendered: StateSetter<PreviewState['oldRendered']>,
    setError: StateSetter<PreviewState['error']>,
}

export default function PreviewPane(props: PluginProps) {
    const { registerAction, container } = props;
    const [rendered, setRendered] = useState<any>();
    const [oldRendered, setOldRendered] = useState<any>();
    const [error, setError] = useState('');
    const boundaryRef = useRef<ErrorBoundary>(null);

    const previewState = wrap<PreviewState>({
        rendered, setRendered,
        oldRendered, setOldRendered,
        error, setError,

        boundaryRef
    });

    registerAction('tryRender', previewState, tryRender);
    registerAction('printFile', previewState, printFile);

    return (
        <PluginWrapper container={container}>
            <div className='md w-full h-full relative focus-within:border-c3 border border-transparent pr-2 print:border-transparent print:w-full'>
                <div className='overflow-auto h-full w-full pb-5 outline-none' tabIndex={3}>
                    {<ErrorBoundary children={rendered} old={oldRendered} ref={boundaryRef} setError={setError} />}
                </div>
            </div>
        </PluginWrapper>
    );
}


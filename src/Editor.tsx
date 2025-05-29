import { useEffect, useMemo, useRef, useState } from 'react';
import './markdown.css';
import EditPane from './EditPane.tsx';
import { getCurrentWindow } from '@tauri-apps/api/window';
import Sidebar from './Sidebar';
import { wrap } from './hooks/wrappedState.ts';
import ErrorBoundary from './ErrorBoundary.tsx';
import { funregHelper, StateSetter } from './utils.ts';
import { saveFile, saveFileAs, openFile, newFile, tryRender, discardChanges, toggleSidebar, printFile } from './EditorActions.ts';

type mode = 'edit' | 'preview' | 'both';

type EditorProps = {
    dir: string,
    plugins: string[],
};

export type EditorState = {
    dir: string,
    plugins: string[],

    filename: string | undefined,   setFilename: StateSetter<EditorState['filename']>,
    unsaved: boolean,               setUnsaved: StateSetter<EditorState['unsaved']>,
    content: string,                setContent: StateSetter<EditorState['content']>,
    rendered: any,                  setRendered: StateSetter<EditorState['rendered']>,
    oldRendered: any,               setOldRendered: StateSetter<EditorState['oldRendered']>,
    error: string,                  setError: StateSetter<EditorState['error']>,
    mode: mode,                     setMode: StateSetter<EditorState['mode']>,
    sidebarOpen: boolean,           setSidebarOpen: StateSetter<EditorState['sidebarOpen']>,
    sidebarEventHandler: React.KeyboardEventHandler,           setSidebarEventHandler: StateSetter<EditorState['sidebarEventHandler']>,

    boundaryRef: React.RefObject<ErrorBoundary | null>,
}
export default function Editor(props: EditorProps) {
    const { dir, plugins } = props;
    const [filename, setFilename] = useState<string>();
    const [unsaved, setUnsaved] = useState(false);
    const [content, setContent] = useState('');
    const [rendered, setRendered] = useState<any>();
    const [oldRendered, setOldRendered] = useState<any>();
    const [error, setError] = useState('');
    const [mode, setMode] = useState<mode>('both');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [sidebarEventHandler, setSidebarEventHandler] = useState<React.KeyboardEventHandler>(() => () => {});
    
    const boundaryRef = useRef<ErrorBoundary>(null);
    
    const editorState = wrap<EditorState>({
        dir, plugins,
        filename, setFilename,
        unsaved, setUnsaved,
        content, setContent,
        rendered, setRendered,
        oldRendered, setOldRendered,
        error, setError,
        mode, setMode,
        sidebarOpen, setSidebarOpen,
        sidebarEventHandler, setSidebarEventHandler,
        boundaryRef,
    });

    useEffect(() => {
        setFilename(undefined);
        setUnsaved(false);
        setContent('');
        setRendered('');
        setError('');
    }, [dir]);

    const window = useMemo(getCurrentWindow, []);
    useEffect(() => {
        window.setTitle(`notic${unsaved ? ' : unsaved changes' : ''}`);
    }, [unsaved])

    funregHelper('saveFile', editorState, saveFile);
    funregHelper('saveFileAs', editorState, saveFileAs);
    funregHelper('openFile', editorState, openFile);
    funregHelper('newFile', editorState, newFile);
    funregHelper('tryRender', editorState, tryRender);
    funregHelper('discard', editorState, discardChanges);
    funregHelper('toggleSidebar', editorState, toggleSidebar);
    funregHelper('printFile', editorState, printFile);

    return (
        <>
            <div className='w-full h-full flex'>
                {sidebarOpen && 
                    <div className='focus-within:inset-shadow-md rounded-md inset-shadow-c1-accent outline-none print:hidden'
                        tabIndex={1} onKeyDown={sidebarEventHandler}>
                            <Sidebar dir={dir} filename={filename} setSidebarEventHandler={setSidebarEventHandler}/>
                    </div>
                }
                <div className='w-full h-full flex'>
                    {(mode === 'edit' || mode === 'both') &&
                        <div className='w-1/2 h-full focus:inset-shadow-md rounded-md inset-shadow-c1-accent outline-none bg-c2-fill text-c2 caret-c1 px-2 print:hidden'
                            tabIndex={2} onKeyDown={onKeyDownEditPane}>
                            <EditPane {...{content, setContent, setUnsaved}} />
                        </div>
                    }
                    {(mode === 'preview' || mode === 'both') &&
                        <div className='md w-1/2 h-full relative focus-within:inset-shadow-md rounded-md inset-shadow-c1-accent pr-2 print:inset-shadow-transparent print:w-full'>
                            <div className='overflow-auto h-full w-full pb-5 outline-none' tabIndex={3}>
                                {<ErrorBoundary children={rendered} old={oldRendered} ref={boundaryRef} setError={setError}/>}
                            </div>
                        </div>
                    }
                </div>
            </div>
        </>
    );
}

function onKeyDownEditPane(event: any) {
    const target = event.target;
    if(target.tabIndex > 0) { // targeting parent and not textarea
        if (!event.shiftKey && !(event.key === 'Tab' && event.shiftKey)) {
            console.log('correct element');
            target.querySelector('textarea').focus();
        }
    } else if(event.key === 'Escape') { // pressing escape in textarea
        target.parentNode.focus();
    } else if(event.key === 'Tab') { // pressing tab in textarea
        document.execCommand('insertText', undefined, '  '); // 2 spaces
        event.preventDefault();
    }
}
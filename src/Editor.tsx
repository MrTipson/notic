import { evaluate } from '@mdx-js/mdx';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as runtime from 'react/jsx-runtime';
import './markdown.css';
import EditPane from './EditPane.tsx';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import remarkGfm from 'remark-gfm';
import { save, ask } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { getCurrentWindow } from '@tauri-apps/api/window';
import Sidebar from './Sidebar';
import { wrap } from './hooks/wrappedState.ts';
import ErrorBoundary from './ErrorBoundary.tsx';
import { funregHelper, StateSetter } from './utils.ts';

const options = {
    ...runtime,
    remarkPlugins: [ remarkFrontmatter, remarkMdxFrontmatter, remarkGfm ],
};
type mode = 'edit' | 'preview' | 'both';

type EditorProps = {
    dir: string,
};

type EditorState = {
    dir: string,

    filename: string | undefined,   setFilename: StateSetter<EditorState['filename']>,
    unsaved: boolean,               setUnsaved: StateSetter<EditorState['unsaved']>,
    content: string,                setContent: StateSetter<EditorState['content']>,
    rendered: any,                  setRendered: StateSetter<EditorState['rendered']>,
    oldRendered: any,               setOldRendered: StateSetter<EditorState['oldRendered']>,
    error: string,                  setError: StateSetter<EditorState['error']>,
    mode: mode,                     setMode: StateSetter<EditorState['mode']>,
    sidebarOpen: boolean,           setSidebarOpen: StateSetter<EditorState['sidebarOpen']>,

    boundaryRef: any,
}
export default function Editor(props: EditorProps) {
    const { dir } = props;
    const [filename, setFilename] = useState<string>();
    const [unsaved, setUnsaved] = useState(false);
    const [content, setContent] = useState('');
    const [rendered, setRendered] = useState<any>();
    const [oldRendered, setOldRendered] = useState<any>();
    const [error, setError] = useState('');
    const [mode, setMode] = useState<mode>('both');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    
    const boundaryRef = useRef<ErrorBoundary>(null);
    
    const editorState = wrap<EditorState>({
        dir,
        filename, setFilename,
        unsaved, setUnsaved,
        content, setContent,
        rendered, setRendered,
        oldRendered, setOldRendered,
        error, setError,
        mode, setMode,
        sidebarOpen, setSidebarOpen,
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

    return (
        <>
            <div className='w-full h-full flex'>
                {sidebarOpen && 
                    <div className='focus:inset-shadow-md rounded-md inset-shadow-c1-accent outline-none'
                        tabIndex={1}><Sidebar dir={dir} /></div>}
                <div className='w-full h-full flex'>
                    {(mode === 'edit' || mode === 'both') &&
                        <div className='w-1/2 h-full focus:inset-shadow-md rounded-md inset-shadow-c1-accent outline-none bg-c2-fill text-c2 caret-c1 px-2'
                            tabIndex={2}>
                            <EditPane {...{content, setContent, setUnsaved}} />
                        </div>
                    }
                    {(mode === 'preview' || mode === 'both') &&
                        <div className='md w-1/2 h-full focus-within:inset-shadow-md rounded-md inset-shadow-c1-accent pr-2'>
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

async function tryRender(state: EditorState){
    const { content, rendered, setRendered, setOldRendered, error, setError } = state;
    try {
        const { default: MDXContent, frontmatter } = await evaluate(content, options);
        // console.log(MDXContent.toString());
        setRendered(MDXContent({ frontmatter }));
        if(!error) setOldRendered(rendered);
        state.boundaryRef.current?.reset();
        setError('');
        // console.log("frontmatter", frontmatter)
    } catch(error: any) {
        console.log(error);
        setError(error);
    }
}

function saveFile(state: EditorState) {
    const { filename, content, setUnsaved } = state;
    if(!filename) {
        return saveFileAs(state);
    }
    console.log('saving', filename);
    tryRender(state);
    writeTextFile(filename, content, {})
    .then(() => setUnsaved(false));
}

function saveFileAs(state: EditorState) {
    const { dir, content, setUnsaved, setFilename } = state;
    save({
        filters: [ { name: 'Markdown', extensions: ['mdx', 'md'] } ],
        defaultPath: dir,
    })
    .then(path => {
        if (path) {
            writeTextFile(path, content, {});
            console.log("file saved");
            setUnsaved(false);
            setFilename(path);
            tryRender(state);
        }
    })
    .catch(err => console.log(err))
}

async function openFile(state: EditorState, name: string) {
    const { setContent, unsaved, setOldRendered, setFilename, setUnsaved, setError } = state;
    if (unsaved && !await discardChanges(state)) {
        return;
    }
    readTextFile(name).then(content => {
        setContent(content);
        setFilename(name);
        setUnsaved(false);
        setOldRendered('');
        setError('');
        tryRender({...state, rendered: '', filename: name, content });
    });
}

async function newFile(state: EditorState) {
    const { setContent, setFilename, setRendered, unsaved, setUnsaved} = state;
    if (unsaved && !await discardChanges(state)) {
        return;
    }
    setFilename(undefined);
    setContent('');
    setUnsaved(true);
    setRendered('');
}

async function discardChanges(state: EditorState) {
    const { setContent, setUnsaved, setRendered, filename } = state;

    const confirmation = await ask(
        'Are you sure?',
        { title: 'notic: Discard changes', kind: 'warning' }
    );
    if (!confirmation) return false;

    if (filename) {
        readTextFile(filename)
        .then(content => {
            setContent(content);
            setUnsaved(false);
            tryRender({...state, content});
        })
    } else {
        setContent('');
        setUnsaved(false);
        setRendered('');
    }
    return true;
}

function toggleSidebar(state: EditorState) {
    const { sidebarOpen, setSidebarOpen } = state;
    setSidebarOpen(!sidebarOpen);
}
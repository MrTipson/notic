import { evaluate } from '@mdx-js/mdx';
import { useEffect, useRef, useState } from 'react';
import * as runtime from 'react/jsx-runtime';
import './markdown.css';
import EditPane from './EditPane.tsx';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import remarkGfm from 'remark-gfm';
import { save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { register } from './functions';
import { getCurrentWindow } from '@tauri-apps/api/window';
import Sidebar from './Sidebar';

const options = {
    ...runtime,
    remarkPlugins: [ remarkFrontmatter, remarkMdxFrontmatter, remarkGfm ],
};
type mode = 'edit' | 'preview' | 'both';

type EditorProps = {
    dir: string,
};

export type StateSetter<T> = React.Dispatch<React.SetStateAction<T>>;
type EditorState = {
    dir: string,

    filename: string | undefined,   setFilename: StateSetter<EditorState['filename']>,
    unsaved: boolean,               setUnsaved: StateSetter<EditorState['unsaved']>,
    content: string,                setContent: StateSetter<EditorState['content']>,
    rendered: any,                  setRendered: StateSetter<EditorState['rendered']>,
    error: string,                  setError: StateSetter<EditorState['error']>,
    mode: mode,                     setMode: StateSetter<EditorState['mode']>,
}
export default function Editor(props: EditorProps) {
    const { dir } = props;
    const [filename, setFilename] = useState<string>();
    const [unsaved, setUnsaved] = useState(false);
    const [content, setContent] = useState('');
    const [rendered, setRendered] = useState<any>();
    const [error, setError] = useState('');
    const [mode, setMode] = useState<mode>('both');
    
    const editorState = useRef<EditorState>({} as EditorState); // we set it every refresh anyways
    editorState.current = {
        dir,
        filename, setFilename,
        unsaved, setUnsaved,
        content, setContent,
        rendered, setRendered,
        error, setError,
        mode, setMode,
    };

    useEffect(() => setFilename(undefined), [dir]);

    useEffect(() => {
        register('saveFile', () => saveFile(editorState.current));
        register('saveFileAs', () => saveFileAs(editorState.current));
        register('openFile', (name: string) => openFile(editorState.current, name));
    }, []);

    return (
        <>
            <div className='w-full h-full flex'>
                <Sidebar dir={dir}/>
                <div className='w-full h-full flex'>
                    {(mode === 'edit' || mode === 'both') && 
                        <EditPane className='w-1/2' content={content} setContent={setContent} />
                    }
                    {(mode === 'preview' || mode === 'both') &&
                        <div className='md w-1/2'>
                            {rendered}
                        </div>
                    }
                </div>
            </div>
        </>
    );
}

async function tryRender(state: EditorState){
    const { content, setRendered, setError } = state;
    try {
        const { default: MDXContent, frontmatter } = await evaluate(content, options);
        // console.log(MDXContent.toString());
        setRendered(MDXContent(frontmatter as any));
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
    const { dir, content, setUnsaved } = state;
    save({
        filters: [ { name: 'Markdown', extensions: ['mdx', 'md'] } ],
        defaultPath: dir,
    })
    .then(path => path === null ? null : writeTextFile(path, content, {}))
    .then(_x => {
        console.log("file saved");
        setUnsaved(false);
    })
    .catch(err => console.log(err))
}

function openFile(state: EditorState, name: string) {
    const { setContent, unsaved, setFilename, setUnsaved } = state;
    if (unsaved) { saveFile(state); }
    readTextFile(name).then(content => {
        setContent(content);
        setFilename(name);
        setUnsaved(false);
        tryRender({...state, filename: name, content });
    });
}
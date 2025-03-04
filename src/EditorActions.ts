import { save, ask } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { EditorState } from './Editor';
import { render } from './plugins';

export async function tryRender(state: EditorState){
    const { rendered, setRendered, setOldRendered, error, setError } = state;
    try {
        setRendered(await render(state));
        if(!error) setOldRendered(rendered);
        state.boundaryRef.current?.reset();
        setError('');
        // console.log("frontmatter", frontmatter)
    } catch(error: any) {
        console.log(error);
        setError(error);
    }
}

export function saveFile(state: EditorState) {
    const { filename, content, setUnsaved } = state;
    if(!filename) {
        return saveFileAs(state);
    }
    console.log('saving', filename);
    tryRender(state);
    writeTextFile(filename, content, {})
    .then(() => setUnsaved(false));
}

export function saveFileAs(state: EditorState) {
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

export async function openFile(state: EditorState, name: string) {
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

export async function newFile(state: EditorState) {
    const { setContent, setFilename, setRendered, unsaved, setUnsaved} = state;
    if (unsaved && !await discardChanges(state)) {
        return;
    }
    setFilename(undefined);
    setContent('');
    setUnsaved(true);
    setRendered('');
}

export async function discardChanges(state: EditorState) {
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

export function toggleSidebar(state: EditorState) {
    const { sidebarOpen, setSidebarOpen } = state;
    setSidebarOpen(!sidebarOpen);
}

import { save, ask } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { EditorState } from './Editor';
import { invoke } from '@/functions';
import { clearCache } from '@/plugins';

export function saveFile(state: EditorState) {
    const { filename, content, setUnsaved } = state;
    if(!filename) {
        return saveFileAs(state);
    }
    console.log('saving', filename);
    writeTextFile(filename, content, {}).then(() => {
        setUnsaved(false);
    invoke('tryRender', filename, content);
    });
}

export function saveFileAs(state: EditorState) {
    const { filename, content, setUnsaved, setFilename } = state;
    save({
        filters: [ { name: 'Markdown', extensions: ['mdx', 'md'] } ],
        defaultPath: filename?.substring(0, filename?.lastIndexOf('/')),
    })
    .then(path => {
        if (path) {
            writeTextFile(path, content, {}).then(() => {
            console.log("file saved");
            setUnsaved(false);
            setFilename(path);
            invoke('tryRender', path, content);
            });
        }
    })
    .catch(err => console.log(err))
}

export async function openFile(state: EditorState, name: string) {
    const { setContent, unsaved, setFilename, setUnsaved } = state;
    if (unsaved && !await discardChanges(state)) {
        return;
    }
    readTextFile(name).then(async content => {
        setContent(content);
        setFilename(name);
        setUnsaved(false);
        await clearCache(name);
        invoke('tryRender', name, content);
    });
}

export async function newFile(state: EditorState) {
    const { setContent, setFilename, unsaved, setUnsaved} = state;
    if (unsaved && !await discardChanges(state)) {
        return;
    }
    setFilename(undefined);
    setContent('');
    setUnsaved(true);
    invoke('tryRender', undefined, '');
}

export async function discardChanges(state: EditorState) {
    const { setContent, setUnsaved, filename } = state;

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
            invoke('tryRender', filename, content);
        })
    } else {
        setContent('');
        setUnsaved(false);
        invoke('tryRender', undefined, '');
    }
    return true;
}


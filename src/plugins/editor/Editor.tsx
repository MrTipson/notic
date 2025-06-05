import { useCallback, useEffect, useMemo, useState } from 'react';
import '@/markdown.css';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { wrap } from '@/hooks/wrappedState.ts';
import { StateSetter } from '@/utils.ts';
import { saveFile, saveFileAs, openFile, newFile, discardChanges } from './EditorActions.ts';
import { PluginProps, PluginWrapper } from '@/plugins';


export type EditorState = {
    filename: string | undefined,   setFilename: StateSetter<EditorState['filename']>,
    unsaved: boolean,               setUnsaved: StateSetter<EditorState['unsaved']>,
    content: string,                setContent: StateSetter<EditorState['content']>,
}
export default function Editor(props: PluginProps) {
    const { registerAction, container } = props;
    const [filename, setFilename] = useState<string>();
    const [unsaved, setUnsaved] = useState(false);
    const [content, setContent] = useState('');
    
    const editorState = wrap<EditorState>({
        filename, setFilename,
        unsaved, setUnsaved,
        content, setContent,
    });

    const window = useMemo(getCurrentWindow, []);
    useEffect(() => {
        window.setTitle(`notic${unsaved ? ' : unsaved changes' : ''}`);
    }, [unsaved])

    const onChange: React.ChangeEventHandler<HTMLTextAreaElement> = useCallback(x => {
        setContent(x.target.value);
        setUnsaved(true);
    }, [setContent, setUnsaved]);

    registerAction('saveFile', editorState, saveFile);
    registerAction('saveFileAs', editorState, saveFileAs);
    registerAction('openFile', editorState, openFile);
    registerAction('newFile', editorState, newFile);
    registerAction('discard', editorState, discardChanges);

    return (
        <PluginWrapper container={container}>
            <div className='w-full h-full focus:border-c3 focus-within:border-c1 border-transparent border outline-none bg-c2-fill text-c2 caret-c1 px-2 print:hidden'
                tabIndex={props.tabIndex} onKeyDown={onKeyDown}>
                    <textarea className='resize-none font-mono outline-none w-full h-full'
                        onChange={onChange} value={content} tabIndex={-1}/>
            </div>
        </PluginWrapper>
    );
}

function onKeyDown(event: any) {
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
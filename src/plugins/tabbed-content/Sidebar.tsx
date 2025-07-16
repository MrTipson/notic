// @ts-nocheck
import { useState } from "react";
import FileBrowser from "../file-browser/FileBrowser";
import { EditorState } from "../editor/Editor";

interface SidebarProps {
    dir: string,
    filename: EditorState['filename'],
    setSidebarEventHandler: EditorState['setSidebarEventHandler'],
}
type viewType = 'file' | 'widget';
export default function Sidebar(props: SidebarProps) {
    const { dir, filename, setSidebarEventHandler: setHandler } = props;
    const [view, _setView] = useState<viewType>('file');

    return (
        <div className="px-1 py-2">
            {
                view === 'file'
                    ? (<FileBrowser dir={dir} filename={filename} setHandler={setHandler} />)
                    : "todo"
            }
        </div>
    );
}

export function toggleSidebar(state: EditorState) {
    const { sidebarOpen, setSidebarOpen } = state;
    setSidebarOpen(!sidebarOpen);
}
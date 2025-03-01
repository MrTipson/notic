import { useState } from "react";
import FileBrowser from "./FileBrowser";

interface SidebarProps {
    dir: string,
}
type viewType = 'file' | 'widget';
export default function Sidebar(props: SidebarProps) {
    const { dir } = props;
    const [view, _setView] = useState<viewType>('file');

    return (
        <div className="px-1 py-2">
            {
                view === 'file'
                ? (<FileBrowser dir={dir}/>)
                : "todo"
            }
        </div>
    );
}
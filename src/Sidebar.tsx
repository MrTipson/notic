import { useState } from "react";
import FileBrowser from "./FileBrowser";

interface SidebarProps {
    dir: string,
}
type viewType = 'file' | 'widget';
export default function Sidebar(props: SidebarProps) {
    const { dir } = props;
    const [view, setView] = useState<viewType>('file');

    return (
        <div>
            {
                view === 'file'
                ? (<FileBrowser dir={dir}/>)
                : "todo"
            }
        </div>
    );
}
import { readDir } from '@tauri-apps/plugin-fs';
import { useMemo, useState } from 'react';
import { invoke } from './functions';

interface FileBrowserProps {
    dir: string,
}
interface FileEntry {
    name: string,
    path: string,
    children: null | (() => FileEntry[]),
    isExpanded?: boolean,
}
function readFolder(prefix: string, name: string, done: ()=>void) {
    const path = name !== '' ? `${prefix}/${name}` : prefix;
    const entry: FileEntry = { name, path, children: () => {
        readDir(path)
        .then(fs => {
            const children = fs.map<FileEntry>(f => {
                if (f.isDirectory) {
                    return readFolder(path, f.name, done);
                } else {
                    return { name: f.name, path: `${path}/${f.name}`, children: null };
                }
            });
            entry.children = () => children;
            done();
        });
        return [];
    }};
    return entry;
}

function renderChildren(children: FileEntry[], refresh: ()=>void) {
    return children
    .sort((a,b) =>
        a.children ? -1 :
        b.children ? 1 :
        a.name.localeCompare(b.name)
    ).map(f => {
        if (f.children) {
            return (
                <details key={f.path} className='pl-6'>
                    <summary className='hover:text-c0' onClick={() => {f.isExpanded = !f.isExpanded; refresh();}}>{f.name}</summary>
                    <div>{f.isExpanded && renderChildren(f.children(), refresh)}</div>
                </details>
            );
        } else {
            return <div key={f.path} className='pl-6 hover:text-c0 cursor-pointer' onClick={() => invoke('openFile', f.path)}>{f.name}</div>    
        }
    });
}

export default function FileBrowser(props: FileBrowserProps) {
    const { dir } = props;
    const [_refresh, _setRefresh] = useState(false);
    const refresh = () => _setRefresh(!_refresh);
    
    const files = useMemo(() => readFolder(dir, '', refresh), [dir]);

    return (
        <div className='text-c1 select-none'>
            {files.children ? renderChildren(files.children(), refresh) : "internal error"}
        </div>
    );
}
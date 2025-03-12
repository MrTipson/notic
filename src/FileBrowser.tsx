import { DirEntry, readDir } from '@tauri-apps/plugin-fs';
import { KeyboardEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { invoke } from './functions';
import { EditorState } from './Editor';

interface FileBrowserProps {
    dir: string,
    filename: EditorState['filename'],
    setHandler: EditorState['setSidebarEventHandler'],
}
interface FileEntry {
    name: string,
    path: string,
    children: null | (() => FileEntry[]),
    isExpanded?: boolean,
    parent: FileEntry | null,
    childIndex: number,
}
function compareDirEntry(a: DirEntry, b: DirEntry) {
    return a.isDirectory === b.isDirectory ? a.name.localeCompare(b.name) : a.isDirectory ? -1 : 1;
}
function readFolder(dir: string, path: string, done: ()=>void) {
    const fullpath = dir + path;
    const entry: FileEntry = { name: 'root', path, parent: null, childIndex: -1, children: () => {
        readDir(fullpath)
        .then(fs => {
            const sorted = fs.sort(compareDirEntry);
            const children = sorted.map<FileEntry>((f,i) => {
                if (f.isDirectory) {
                    const e = readFolder(fullpath, '/' + f.name, done);
                    e.parent = entry;
                    e.childIndex = i;
                    return e;
                } else {
                    return { name: f.name, path: `${path}/${f.name}`, children: null, parent: entry, childIndex: i };
                }
            });
            entry.children = () => children;
            done();
        });
        return [];
    }};
    return entry;
}

function renderChildren(
    children: FileEntry[],
    onFile: (entry: FileEntry) => void,
    onToggleExpand: (entry: FileEntry) => void,
    highlighted?: FileEntry
){
    return children.map(f => {
        if (f.children) {
            return (
                <details key={f.path} className='pl-6 outline-none' open={f.isExpanded}>
                    <summary className={'hover:text-c0 outline-none' + (highlighted === f ? ' text-c1-accent!' : '')}
                        onClick={(e) => {onToggleExpand(f); e.preventDefault()}}>{f.name}</summary>
                    <div>{f.isExpanded && renderChildren(f.children(), onFile, onToggleExpand, highlighted)}</div>
                </details>
            );
        } else {
            return <div className={'pl-6 hover:text-c0 cursor-pointer' + (highlighted === f ? ' text-c1-accent! ' : '')}
                    key={f.path}  onClick={() => onFile(f)}>{f.name}</div>
        }
    });
}

export default function FileBrowser(props: FileBrowserProps) {
    const { dir, filename, setHandler } = props;
    const [_refresh, _setRefresh] = useState(false);
    const [highlighted, setHighlighted] = useState<FileEntry>();
    const refresh = useMemo(() => () => _setRefresh(!_refresh), [_refresh, _setRefresh]);

    const handleInput = useCallback((event: KeyboardEvent) => {
        if (!highlighted) {
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                const children = (files.children as any)();
                if (children.length > 0) {
                    setHighlighted(children[0]);
                }
            }
            return;
        }
        switch (event.key) {
            case 'ArrowUp': {
                if (highlighted.childIndex > 0) {
                    let children = (highlighted.parent?.children as any)();
                    let previous = children[highlighted.childIndex - 1];
                    while (previous.isExpanded) {
                        children = previous.children();
                        previous = children[children.length - 1];
                    }
                    setHighlighted(previous);
                } else if (highlighted.parent && highlighted.parent.name !== '') {
                    setHighlighted(highlighted.parent);
                }
                break;
            }
            case 'ArrowDown': {
                if (highlighted.children && highlighted.isExpanded) {
                    setHighlighted(highlighted.children()[0]);
                    break;
                }
                let index = highlighted.childIndex;
                let parent = highlighted.parent as FileEntry;
                let siblings = (parent.children as any)();
                while (index === siblings.length - 1) {
                    if (!parent?.parent) break;
                    index = parent.childIndex;
                    parent = parent.parent as FileEntry;
                    siblings = (parent.children as any)();
                }
                if (index < siblings.length - 1) {
                    setHighlighted(siblings[index + 1]);
                }
                break
            }
            case 'ArrowLeft': {
                if (highlighted.children && highlighted.isExpanded) {
                    highlighted.isExpanded = false;
                    refresh();
                    break;
                }
                const parent = highlighted?.parent;
                if (parent && parent.name !== '') {
                    setHighlighted(parent);
                }
                break;
            }
            case 'ArrowRight': {
                if (highlighted.children) {
                    if (highlighted.isExpanded && highlighted.children().length > 0) {
                        setHighlighted(highlighted.children()[0]);
                    } else {
                        highlighted.isExpanded = true;
                        refresh();
                    }
                } else {
                    invoke('openFile', highlighted.path);
                }
                break;
            }
        }
    }, [highlighted, refresh]);

    useEffect(() => setHandler(() => handleInput), [handleInput, setHandler]);

    const onFile = useCallback((entry: FileEntry) => {
        invoke('openFile', entry.path);
        setHighlighted(entry);
    }, [setHighlighted]);
    const onToggleExpand = useCallback((entry: FileEntry) => {
        entry.isExpanded = !entry.isExpanded;
        refresh();
    }, [refresh]);
    
    const files = useMemo(() => readFolder(dir, '', refresh), [dir]);

    return (
        <div className='text-c1 select-none pr-2'>
            <div className="text-sm text-c2 pl-2">{dir.split("/").pop()}</div>
            {files.children ? renderChildren(files.children(), onFile, onToggleExpand, highlighted) : "internal error"}
        </div>
    );
}

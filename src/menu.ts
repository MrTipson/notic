import { Menu, PredefinedMenuItemOptions } from "@tauri-apps/api/menu";
import { shortcuts } from "./hotkeys";
import { invoke } from "./functions";

function menuItem(text: string, id: string) {
    return {
        text, id,
        kind: 'MenuItem',
        action: invoke,
        ...id in shortcuts && {accelerator: shortcuts[id as keyof typeof shortcuts].join('+')},
    };
}
function sep(): PredefinedMenuItemOptions {
    return { item: 'Separator' };
}

export function setupMenu() {
    Menu.new({items: [
        {kind: 'Submenu', id: 'file', text: '&File', items: [
            menuItem('New File', 'newFile'),
            sep(),
            menuItem('Open Folder', 'openDirectory'),
            sep(),
            menuItem('Save File', 'saveFile'),
            menuItem('Save File As', 'saveFileAs'),
            sep(),
            menuItem('Export File', 'printFile'),
            sep(),
            { text: 'Quit', item: 'Quit'},
        ]},
        {kind: 'Submenu', id: 'edit', text: '&Edit', items: [
            { text: 'Undo', item: 'Undo'},
            { text: 'Redo', item: 'Redo'},
            { text: 'Copy', item: 'Copy'},
            { text: 'Cut', item: 'Cut'},
            { text: 'Paste', item: 'Paste'},
            menuItem('Render', 'tryRender'),
        ]},
        {kind: 'Submenu', id: 'view', text: '&View', items: [
            menuItem('Toggle sidebar', 'toggleSidebar'),
        ]}
    ]})
    .then(menu => menu.setAsAppMenu());
}

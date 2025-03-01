const defaultShortcuts = {
    "openDirectory": ["ctrl", "o"],
    "saveFile": ["ctrl", "s"],
    "saveFileAs": ["ctrl", "shift", "s"],
    'newFile': ['ctrl', 'n'],
    'tryRender': ['ctrl', 'Tab'],
    'toggleSidebar': ['ctrl', 'b'],
}

// TODO: read config file
export const shortcuts = Object.freeze(defaultShortcuts);

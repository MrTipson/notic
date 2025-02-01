import { invoke } from "./functions";

const defaultShortcuts = {
    "openDirectory": ["ctrl", "o"],
    "saveFile": ["ctrl", "s"],
    "saveFileAs": ["ctrl", "shift", "s"],
}

// TODO: read config file
const shortcuts = defaultShortcuts;

const CTRL = 8;
const SHIFT = 4;
const META = 2;
const ALT = 1;

function convert (keys: string[]) {
    let mod = 0;
    let key = null;
    for (const x of keys) {
        if (x === "ctrl")       mod |= CTRL;
        else if (x === "shift") mod |= SHIFT;
        else if (x === "meta")  mod |= META;
        else if (x === "alt")   mod |= ALT;
        else if (!key)          key = x;
        else                    return {mod:-1, key:null};
    }
    return {mod, key};
}

const lookup: any = [];
for (let i = 0; i < 16; i++) lookup.push({});

for (const [f,keys] of Object.entries(shortcuts)) {
    
    let {mod, key} = convert(keys);
    if (!key) {
        console.log("Skipping invalid shortcut", keys);
        continue;
    }
    lookup[mod][key] = f;
}

export function shortcutHandler(event: KeyboardEvent) {
    let mod = 0;
    if(event.ctrlKey)   mod |= CTRL;
    if(event.shiftKey)  mod |= SHIFT;
    if(event.metaKey)   mod |= META;
    if(event.altKey)    mod |= ALT;
    
    // console.log("handler", mod, event.key);
    const perMod = lookup[mod];

    // console.log(perMod);
    const keys = [event.key.toLowerCase(), event.code];
    for (const key of keys) {
        const name = perMod[key];
        if (name && invoke(name)) break;
    }
}
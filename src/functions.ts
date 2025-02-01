const functions = new Map();

export function register(name: string, f: Function) {
    console.log("registering function for", name);
    functions.set(name, f);
}

export function invoke(name: string, ...rest: any[]) {
    const f = functions.get(name);
    // console.log('invoke', f);
    if (!f) return false;
    f(...rest);
    return true;
}
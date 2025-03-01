import { RefObject, useEffect } from "react";
import { register, unregister } from "./functions";

export type StateSetter<T> = React.Dispatch<React.SetStateAction<T>>;

export function funregHelper<T>(name: string, state: RefObject<T>, f: (arg0: T, ...rest: any[]) => any) {
    useEffect(() => {
        register(name, (...rest: any[]) => f(state.current, ...rest));
        return () => unregister(name);
    }, [f]);
}
import { useRef } from "react";

export function wrap<T>(newState: T) {
    const state = useRef<T>({} as T);
    state.current = newState;
    return state;
}
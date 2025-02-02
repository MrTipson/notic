import { useEffect, useRef, useState } from "react";
import "./App.css";
import Editor, { StateSetter } from "./Editor.tsx";
import { open } from '@tauri-apps/plugin-dialog';
import { shortcutHandler } from "./hotkeys.ts";
import { register } from "./functions.ts";
import { wrap } from "./hooks/wrappedState.ts";

type AppState = {
  dir: string | undefined, setDir: StateSetter<AppState['dir']>
}
export default function App() {
  const [dir, setDir] = useState<AppState["dir"]>();
  // console.log(dir);
  const appState = wrap<AppState>({ dir, setDir });

  useEffect(() => {
    document.addEventListener('keydown', shortcutHandler);
    register("openDirectory", () => openDir(appState.current));

    return () => document.removeEventListener('keydown', shortcutHandler);
  }, []);

  return (
    <div className="dark bg-c1-fill w-full h-full">
      <main className="px-10 w-full h-full">
        {dir &&
          <Editor dir={dir}/>
        }
      </main>
    </div>
  );
}

function openDir(state: AppState) {
  const { setDir } = state;

  open({ multiple: false, directory: true, })
    .then((x: string | null) => x && setDir(x));
}

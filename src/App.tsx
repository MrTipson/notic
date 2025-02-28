import { useState } from "react";
import "./App.css";
import Editor from "./Editor.tsx";
import { open } from '@tauri-apps/plugin-dialog';
import { wrap } from "./hooks/wrappedState.ts";
import { funregHelper, StateSetter } from "./utils.ts";

type AppState = {
  dir: string | undefined, setDir: StateSetter<AppState['dir']>
}
export default function App() {
  const [dir, setDir] = useState<AppState["dir"]>();
  // console.log(dir);
  const appState = wrap<AppState>({ dir, setDir });

  funregHelper("openDirectory", appState, openDir);

  return (
    <div className="bg-c1-fill w-full h-full">
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

  open({ multiple: false, directory: true, recursive: true, })
    .then((x: string | null) => x && setDir(x));
}

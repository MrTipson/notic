import { useEffect, useState } from "react";
import "./App.css";
import { wrap } from "./hooks/wrappedState.ts";
import { funregHelper, StateSetter } from "./utils.ts";
import { importPlugins, NoticPluginWithId, PluginComponent } from "@/plugins/";

type AppState = {
  plugins: string[],       setPlugins: StateSetter<AppState['plugins']>,
  components: Map<string, PluginComponent>, setComponents: StateSetter<AppState['components']>,
}
export default function App() {
  const [plugins, setPlugins] = useState<AppState['plugins']>([]);
  const [components, setComponents] = useState<AppState['components']>(new Map());
  // console.log(dir);
  const _appState = wrap<AppState>({
    plugins, setPlugins,
    components, setComponents,
  });

  useEffect(() => setPlugins(['gfm', 'layout', 'placeholders', 'editor', 'file-browser', 'preview']), [])
  useEffect(() => {
    importPlugins(plugins).then(({ imported }) => {
      setComponents(getComponents(imported))
    })
  }, [plugins])

  const sadman = (props: any) => ':('; 
  const FileBrowser = components.get('file-browser') || sadman;
  const Editor = components.get('editor') || sadman;
  const PreviewPane = components.get('preview') || sadman;

  return (
    <div className="bg-c1-fill w-full h-full">
      <main className="w-full h-full flex">
          <FileBrowser registerAction={funregHelper} tabIndex={1}/>          
          <Editor registerAction={funregHelper} tabIndex={2}/>
          <PreviewPane registerAction={funregHelper} tabIndex={3}/>
      </main>
    </div>
  );
}

type PluginWithComponent = NoticPluginWithId & { component: PluginComponent }
function getComponents(imported: NoticPluginWithId[]) {
  return new Map(imported
    .filter((x): x is PluginWithComponent => !!x.component)
    .map(x => [x.id, x.component])
  );
}

import { useEffect, useState } from "react";
import "./App.css";
import { wrap } from "./hooks/wrappedState.ts";
import { funregHelper, StateSetter } from "./utils.ts";
import { importPlugins, NoticPluginWithId, PluginComponent } from "@/plugins/";

type AppState = {
  plugins: string[],       setPlugins: StateSetter<AppState['plugins']>,
  components: Map<string, PluginComponent>, setComponents: StateSetter<AppState['components']>,
  layout: string,          setLayout: StateSetter<AppState['layout']>,
}
export default function App() {
  const [layout, setLayout] = useState('app-layout#default');
  const [plugins, setPlugins] = useState<AppState['plugins']>(['gfm', 'frontmatter', 'layout', 'placeholders', 'editor', 'file-browser', 'preview', 'app-layout']);
  const [components, setComponents] = useState<AppState['components']>(new Map());
  // console.log(dir);
  const _appState = wrap<AppState>({
    layout, setLayout,
    plugins, setPlugins,
    components, setComponents,
  });

  useEffect(() => {
    importPlugins(plugins).then(({ imported }) => {
      setComponents(getComponents(imported))
    });
  }, [plugins]);

  const [layoutName, layoutId] = layout.split('#');
  const LayoutComponent = components.get(layoutName) || (() => <p>Layout component {layoutName} not found</p>);
  return (
    <div className="bg-c1-fill w-full h-full">
      <main className="w-full h-full flex">
        <LayoutComponent id={layoutId} components={components} registerAction={funregHelper}/>
      </main>
    </div>
  );
}

type PluginWithComponents = NoticPluginWithId & Required<Pick<NoticPluginWithId, 'uiComponents'>>
function getComponents(imported: NoticPluginWithId[]) {
  return new Map<string, PluginComponent>(Array.prototype.concat(...
    imported 
    .filter((x): x is PluginWithComponents => !!x.uiComponents)
    .map(x => 
      Object.entries(x.uiComponents).map(([k, v]) => 
        [k === 'default' ? x.id : `${x.id}.${k}`, v]
      )
    )
  ));
}

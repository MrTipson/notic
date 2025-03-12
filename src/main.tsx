import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { setupMenu } from "./menu";
import { openUrl } from "@tauri-apps/plugin-opener";
import { invoke } from "./functions";

setupMenu();

document.querySelector("html")?.classList.add("dark");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

window.addEventListener('click', async (e) => {
  const t = e.target;
  if (t && 'tagName' in t && t.tagName === 'A') { // alter behaviour of anchor tags

    const a = t as HTMLAnchorElement;
    
    if (a.hash) return; // leave id anchors alone
    e.preventDefault(); // dont change location
    
    if (a.host === 'localhost:1420') { // Relative links
      invoke('openFile', a.pathname)
    } else { // Websites
      // doesnt work yet
      // https://github.com/tauri-apps/tauri/issues/10617
      console.log('should open', a.href, 'but tauri bug');
      await openUrl(a.href);
    }
  }
});
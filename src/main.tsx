import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { setupMenu } from "./menu";

setupMenu();

document.querySelector("html")?.classList.add("dark");

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

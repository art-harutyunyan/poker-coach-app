import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./ui/App";
import "./styles/global.css";
import "./styles/poker-seats.css";
import "./styles/replayer-shell.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

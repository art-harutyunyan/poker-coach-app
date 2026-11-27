import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./ui/App";
import "./styles/global.css";
import "./styles/poker-seats.css";
import "./styles/study-shell.css";
import "./styles/replayer-shell.css";
import "./styles/study-pages.css";
import "./styles/tournament-import.css";
import "./styles/tournament-library.css";
import "./styles/tournament-stats.css";
import "./styles/playing-cards.css";
import "./ui/design/nocturne.css";
import "./styles/nocturne-shell.css";
import "./styles/nocturne-tournament-overview.css";
import "./styles/nocturne-hand-browser.css";
import "./styles/nocturne-tournament-import.css";
import "./styles/nocturne-replayer-shell.css";
import "./styles/nocturne-replay-controls.css";
import "./styles/nocturne-replayer-analysis.css";
import "./styles/nocturne-replayer-browse.css";
import "./styles/nocturne-replayer-reconciliation.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import InstallAppButton from "./InstallAppButton.jsx";
import "./styles.css";
createRoot(document.getElementById("root")).render(<React.StrictMode><><App /><InstallAppButton /></></React.StrictMode>);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(error => console.error("PWA service worker registration failed:", error)));
}

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import "./InstallAppButton.css";

export default function InstallAppButton() {
  const [installEvent, setInstallEvent] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = event => { event.preventDefault(); setInstallEvent(event); };
    const onInstalled = () => { setInstalled(true); setInstallEvent(null); };
    setInstalled(window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  if (!installEvent || installed) return null;
  return <button className="pwa-install-button" onClick={async () => { await installEvent.prompt(); setInstallEvent(null); }}><Download size={16}/> Install app</button>;
}

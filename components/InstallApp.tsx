"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

// Chrome/Edge/Android fire this before they would show their own install UI.
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const standaloneQuery = "(display-mode: standalone)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(standaloneQuery);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
const isInstalled = () =>
  window.matchMedia(standaloneQuery).matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
// iPadOS Safari reports itself as a Mac; a touch screen gives it away.
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

// "Install the app" block for Goals (DD-039). Android: one button. iPhone (no prompt API): two steps. Installed: nothing.
export default function InstallApp() {
  const installed = useSyncExternalStore(subscribe, isInstalled, () => true); // server: render nothing
  const ios = useSyncExternalStore(subscribe, isIOS, () => false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);

  useEffect(() => {
    const keep = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    const done = () => setPrompt(null);
    window.addEventListener("beforeinstallprompt", keep);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("beforeinstallprompt", keep);
      window.removeEventListener("appinstalled", done);
    };
  }, []);

  if (installed || (!prompt && !ios)) return null;

  return (
    <section aria-labelledby="install" className="space-y-3 border-t border-[var(--divider)] pt-6">
      <h2 id="install" className="label">
        App
      </h2>
      <p className="text-sm text-[var(--muted)]">Add GO—YOU to your home screen. It opens full screen and Train works without signal.</p>
      {prompt ? (
        <button
          type="button"
          className="btn btn-primary btn-lg w-full"
          onClick={async () => {
            await prompt.prompt();
            await prompt.userChoice;
            setPrompt(null); // a prompt can only be used once
          }}
        >
          Install app
        </button>
      ) : (
        <ol className="space-y-2 text-sm">
          <li className="grid grid-cols-[1.5rem_1fr] border-t border-[var(--divider)] pt-2">
            <span className="font-bold tabular">1</span>Tap Share in Safari&apos;s toolbar.
          </li>
          <li className="grid grid-cols-[1.5rem_1fr] border-t border-[var(--divider)] pt-2">
            <span className="font-bold tabular">2</span>Choose Add to Home Screen.
          </li>
        </ol>
      )}
    </section>
  );
}

import { App } from "./App";
import { LandingPage } from "./LandingPage";
import { isTauriApp } from "./lib/tauriFiles";

export function Root() {
  if (isTauriApp()) return <App />;

  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/editor") return <App />;

  return <LandingPage />;
}

import { Analytics } from "@vercel/analytics/react";
import { App } from "./App";
import { DownloadsPage } from "./DownloadsPage";
import { LandingPage } from "./LandingPage";
import { LegalPage } from "./LegalPage";
import { isTauriApp } from "./lib/tauriFiles";

export function Root() {
  if (isTauriApp()) return <App />;

  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/editor") {
    return (
      <>
        <App />
        <Analytics />
      </>
    );
  }

  if (path === "/downloads") {
    return (
      <>
        <DownloadsPage />
        <Analytics />
      </>
    );
  }

  if (path === "/terms" || path === "/terms-and-conditions") {
    return (
      <>
        <LegalPage kind="terms" />
        <Analytics />
      </>
    );
  }

  if (path === "/privacy" || path === "/privacy-policy") {
    return (
      <>
        <LegalPage kind="privacy" />
        <Analytics />
      </>
    );
  }

  return (
    <>
      <LandingPage />
      <Analytics />
    </>
  );
}

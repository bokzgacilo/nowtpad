import { useMemo, useState } from "react";

const githubReleaseBase = "https://github.com/bokzgacilo/nowtpad/releases/tag";

type DownloadAsset = {
  platform: string;
  detail: string;
  filename: string;
};

type ReleaseOption = {
  version: string;
  label: string;
  status: string;
  notes: string;
  assets: DownloadAsset[];
};

const releases: ReleaseOption[] = [
  {
    version: "0.2.1",
    label: "v0.2.1",
    status: "Latest",
    notes:
      "macOS repair build with a fixed app signature. Replaces v0.2.0 for Apple Silicon installs.",
    assets: [
      {
        platform: "macOS",
        detail: "Apple Silicon DMG",
        filename: "nowtpad-0.2.1-macos-aarch64.dmg",
      },
    ],
  },
  {
    version: "0.2.0",
    label: "v0.2.0",
    status: "Previous",
    notes: "Previous v0.2 build. Use v0.2.1 for the repaired macOS DMG.",
    assets: [
      {
        platform: "macOS",
        detail: "Apple Silicon DMG",
        filename: "nowtpad-0.2.0-macos-aarch64.dmg",
      },
    ],
  },
];

function releaseUrl(version: string) {
  return `${githubReleaseBase}/v.${version}`;
}

export function DownloadsPage() {
  const [selectedVersion, setSelectedVersion] = useState(releases[0].version);
  const selectedRelease = useMemo(
    () =>
      releases.find((release) => release.version === selectedVersion) ??
      releases[0],
    [selectedVersion],
  );

  return (
    <main className="landing-page downloads-page">
      <a className="skip-link" href="#downloads-title">
        Skip to content
      </a>
      <section className="downloads-hero" aria-labelledby="downloads-title">
        <nav className="landing-nav" aria-label="Main navigation">
          <a className="landing-brand" href="/" aria-label="nowtpad home">
            <span>nowtpad</span>
          </a>
          <div className="landing-nav-links">
            <a className="landing-nav-link" href="/terms">
              Terms
            </a>
            <a className="landing-nav-link" href="/privacy">
              Privacy
            </a>
            <a className="landing-nav-link" href="/editor">
              Open editor
            </a>
          </div>
        </nav>

        <div className="downloads-hero-inner">
          <p className="landing-release">GitHub releases</p>
          <h1 id="downloads-title">Downloads</h1>
          <p className="downloads-lede">
            Pick a nowtpad version and download the installer directly from the
            GitHub release archive.
          </p>
        </div>
      </section>

      <section className="downloads-browser" aria-label="Download versions">
        <div className="downloads-version-panel">
          <p className="landing-release">Version</p>
          <div className="downloads-version-list" role="list">
            {releases.map((release) => (
              <button
                key={release.version}
                type="button"
                className={
                  release.version === selectedRelease.version
                    ? "downloads-version active"
                    : "downloads-version"
                }
                onClick={() => setSelectedVersion(release.version)}
              >
                <span>
                  <strong>{release.label}</strong>
                  <small>{release.status}</small>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="downloads-release-panel">
          <div className="downloads-release-heading">
            <div>
              <p className="landing-release">{selectedRelease.status}</p>
              <h2>{selectedRelease.label}</h2>
            </div>
            <a
              className="downloads-release-link"
              href={releaseUrl(selectedRelease.version)}
            >
              View release
            </a>
          </div>

          <p className="downloads-release-note">{selectedRelease.notes}</p>

          <div className="landing-download-list">
            {selectedRelease.assets.map((asset) => (
              <a
                key={asset.filename}
                className="landing-download-item"
                href={releaseUrl(selectedRelease.version)}
              >
                <span>
                  <strong>{asset.platform}</strong>
                  <small>{asset.detail}</small>
                </span>
                <b>Open release</b>
              </a>
            ))}
          </div>
        </div>
      </section>

      <footer className="site-footer" aria-label="Site links">
        <a href="/terms">Terms</a>
        <a href="/privacy">Privacy</a>
        <a href="/downloads">Downloads</a>
        <a href="https://github.com/bokzgacilo/nowtpad">GitHub</a>
      </footer>
    </main>
  );
}

const version = "0.1.0";

export function LandingPage() {
  return (
    <main className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <nav className="landing-nav" aria-label="Main navigation">
          <a className="landing-brand" href="/" aria-label="nowtpad home">
            <img src="/notepad-icon.svg" alt="" />
            <span>nowtpad</span>
          </a>
          <a className="landing-nav-link" href="/editor">
            Open editor
          </a>
        </nav>

        <div className="landing-hero-grid">
          <div className="landing-copy">
            <p className="landing-release">Latest version {version}</p>
            <h1 id="landing-title">nowtpad</h1>
            <p className="landing-lede">
              A lightweight Notepad-style editor for writing notes, editing
              code, and working with local text files across desktop and web.
            </p>

            <div className="landing-actions" aria-label="Primary actions">
              <a className="landing-button primary" href="#downloads">
                Download app
              </a>
              <a className="landing-button secondary" href="/editor">
                Open web editor
              </a>
            </div>
          </div>

          <figure className="landing-product-shot">
            <img src="/app-screenshot.png" alt="nowtpad editor window" />
            <figcaption>
              Clean tabs, local drafts, syntax-aware editing.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="landing-summary" aria-label="What nowtpad does">
        <div>
          <h2>Simple text editing, without the clutter.</h2>
          <p>
            nowtpad opens common text, code, config, and web files in a fast
            tabbed editor. Drafts are saved on your device, files can be opened
            by drag and drop, and the editor works offline when you need it.
          </p>
        </div>
        <ul className="landing-feature-list">
          <li>Multiple tabs for notes and files</li>
          <li>Open, save, and save-as flows</li>
          <li>Light and dark themes</li>
          <li>Syntax highlighting powered by Monaco</li>
        </ul>
      </section>

      <section
        id="downloads"
        className="landing-downloads"
        aria-labelledby="download-title"
      >
        <div className="landing-section-heading">
          <p className="landing-release">Choose your platform</p>
          <h2 id="download-title">Download nowtpad</h2>
        </div>

        <div className="landing-download-list">
          <a
            className="landing-download-item"
            href="/downloads/nowtpad-0.1.0-windows-x64.exe"
            download
          >
            <span>
              <strong>Windows</strong>
              <small>Executable installer, x64</small>
            </span>
            <b>Download .exe</b>
          </a>

          <a
            className="landing-download-item"
            href="/downloads/nowtpad-0.1.0-macos-aarch64.dmg"
            download
          >
            <span>
              <strong>macOS</strong>
              <small>DMG for Apple Silicon</small>
            </span>
            <b>Download .dmg</b>
          </a>

          <a className="landing-download-item" href="/editor">
            <span>
              <strong>Web</strong>
              <small>Runs in your browser</small>
            </span>
            <b>Open editor</b>
          </a>
        </div>
      </section>
    </main>
  );
}

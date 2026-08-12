import { ChevronLeft, ChevronRight, Globe2, Star } from "lucide-react";
import { useState } from "react";
import { FaApple, FaWindows } from "react-icons/fa";

const latestDmg = {
  href: "/downloads/nowtpad-0.2.0-macos-aarch64.dmg",
  version: "v0.2.0",
};

const windowsExe = {
  href: "/downloads/nowtpad-0.1.0-windows-x64.exe",
  version: "v0.1.0",
};

const heroScreenshots = [
  {
    src: "/screenshots/banner.png",
    alt: "nowtpad editor banner screenshot",
    title: "Clean editor",
    caption: "A focused desktop workspace for notes, text, and code.",
  },
  {
    src: "/screenshots/themes.png",
    alt: "nowtpad theme options screenshot",
    title: "Theme options",
    caption: "Switch the editor look to match your writing environment.",
  },
  {
    src: "/screenshots/built-with-rust-fast-and-ram-efficient.png",
    alt: "nowtpad performance screenshot highlighting Rust efficiency",
    title: "Fast and efficient",
    caption: "Built with Rust and Tauri for a small, responsive desktop app.",
  },
];

const heroFeatures = [
  "Tabbed editing for notes and code",
  "Local drafts and file save flows",
  "Syntax highlighting with Monaco",
];

const heroReviews = [
  {
    quote: "Fast, simple, and exactly what I want from a daily notepad.",
    source: "Early tester",
  },
  {
    quote: "The local draft recovery makes it feel dependable.",
    source: "Desktop user",
  },
];

export function LandingPage() {
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  const currentScreenshot = heroScreenshots[activeScreenshot];

  const showPreviousScreenshot = () => {
    setActiveScreenshot((index) =>
      index === 0 ? heroScreenshots.length - 1 : index - 1,
    );
  };

  const showNextScreenshot = () => {
    setActiveScreenshot((index) =>
      index === heroScreenshots.length - 1 ? 0 : index + 1,
    );
  };

  return (
    <main className="landing-page">
      <a className="skip-link" href="#landing-title">
        Skip to content
      </a>
      <section className="landing-hero" aria-labelledby="landing-title">
        <nav className="landing-nav" aria-label="Main navigation">
          <a className="landing-brand" href="/" aria-label="nowtpad home">
            <span>nowtpad</span>
          </a>
          <div className="landing-nav-links">
            <a className="landing-nav-link" href="/downloads">
              Downloads
            </a>
            <a className="landing-nav-link" href="/editor">
              Open editor
            </a>
          </div>
        </nav>

        <div className="landing-hero-grid app-store-hero">
          <figure
            className="landing-product-carousel"
            aria-label="nowtpad screenshot carousel"
          >
            <div className="landing-carousel-frame">
              {heroScreenshots.map((screenshot, index) => (
                <img
                  key={screenshot.title}
                  className={
                    index === activeScreenshot
                      ? "landing-carousel-image active"
                      : "landing-carousel-image"
                  }
                  src={screenshot.src}
                  alt={screenshot.alt}
                  aria-hidden={index !== activeScreenshot}
                />
              ))}

              <div className="landing-carousel-controls">
                <button
                  className="landing-carousel-button"
                  type="button"
                  onClick={showPreviousScreenshot}
                  aria-label="Show previous screenshot"
                >
                  <ChevronLeft aria-hidden="true" size={18} />
                </button>
                <button
                  className="landing-carousel-button"
                  type="button"
                  onClick={showNextScreenshot}
                  aria-label="Show next screenshot"
                >
                  <ChevronRight aria-hidden="true" size={18} />
                </button>
              </div>
            </div>

            <figcaption className="landing-carousel-caption" aria-live="polite">
              <strong>{currentScreenshot.title}</strong>
              <span>{currentScreenshot.caption}</span>
            </figcaption>

            <div className="landing-carousel-dots" aria-label="Choose screenshot">
              {heroScreenshots.map((screenshot, index) => (
                <button
                  key={screenshot.title}
                  className={
                    index === activeScreenshot
                      ? "landing-carousel-dot active"
                      : "landing-carousel-dot"
                  }
                  type="button"
                  onClick={() => setActiveScreenshot(index)}
                  aria-label={`Show ${screenshot.title}`}
                  aria-pressed={index === activeScreenshot}
                />
              ))}
            </div>
          </figure>

          <div className="landing-copy app-store-copy">
            <p className="landing-release">Latest version {latestDmg.version}</p>
            <div className="app-title-row">
              <h1 id="landing-title">nowtpad</h1>
              <span className="app-price">Free</span>
              <div className="platform-logos" aria-label="Available platforms">
                <span title="macOS">
                  <FaApple aria-hidden="true" />
                </span>
                <span title="Windows">
                  <FaWindows aria-hidden="true" />
                </span>
                <span title="Web">
                  <Globe2 aria-hidden="true" size={18} />
                </span>
              </div>
            </div>
            <p className="landing-lede">
              A lightweight Notepad-style editor for writing notes, editing
              code, and working with local text files across desktop and web.
            </p>

            <ul className="hero-feature-list" aria-label="Key features">
              {heroFeatures.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>

            <div className="landing-actions" aria-label="Primary actions">
              <a
                className="landing-button primary"
                href={latestDmg.href}
                download
              >
                Download DMG ({latestDmg.version})
              </a>
              <a
                className="landing-button secondary"
                href={windowsExe.href}
                download
              >
                Download EXE ({windowsExe.version})
              </a>
              <a className="landing-button secondary" href="/editor">
                Open web editor
              </a>
            </div>

            <div className="hero-reviews" aria-label="User reviews">
              {heroReviews.map((review) => (
                <blockquote key={review.source} className="hero-review">
                  <div className="hero-review-stars" aria-label="5 out of 5 stars">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} aria-hidden="true" size={13} />
                    ))}
                  </div>
                  <p>{review.quote}</p>
                  <cite>{review.source}</cite>
                </blockquote>
              ))}
            </div>
          </div>
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
            href="https://github.com/bokzgacilo/nowtpad/releases/tag/v.0.2.0"
          >
            <span>
              <strong>Previous</strong>
              <small>v.0.2.0 release page</small>
            </span>
            <b>Open release</b>
          </a>

          <a
            className="landing-download-item"
            href="https://github.com/bokzgacilo/nowtpad/releases/tag/v.0.2.1"
          >
            <span>
              <strong>macOS</strong>
              <small>DMG for Apple Silicon</small>
            </span>
            <b>Open release</b>
          </a>

          <a className="landing-download-item" href="/downloads">
            <span>
              <strong>More versions</strong>
              <small>Browse every available release</small>
            </span>
            <b>Browse</b>
          </a>
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

type LegalPageProps = {
  kind: "terms" | "privacy";
};

const effectiveDate = "August 12, 2026";

const termsSections = [
  {
    title: "Use of nowtpad",
    body: "nowtpad is provided as a lightweight text editor for personal and work files. You are responsible for the content you create, open, edit, save, download, or share with the app.",
  },
  {
    title: "Local files and drafts",
    body: "The desktop app works with files you choose on your device. The web editor may store draft content locally in your browser so you can recover work later on the same device.",
  },
  {
    title: "Downloads and releases",
    body: "Installers are distributed through GitHub Releases. Older releases may remain available for compatibility, but the latest release is generally recommended.",
  },
  {
    title: "No warranty",
    body: "nowtpad is provided as-is, without guarantees that it will be uninterrupted, error-free, or suitable for every file or workflow. Back up important files before editing them.",
  },
  {
    title: "Limitation of liability",
    body: "To the fullest extent allowed by law, the project maintainers are not liable for lost data, lost profits, device issues, or other damages related to using nowtpad.",
  },
  {
    title: "Changes",
    body: "These terms may change as nowtpad changes. Continued use of the app after updates means you accept the revised terms.",
  },
];

const privacySections = [
  {
    title: "What nowtpad stores",
    body: "nowtpad is designed around local editing. Drafts and editor state may be saved on your device or in your browser storage so the editor can restore your work.",
  },
  {
    title: "Files you open",
    body: "Files selected in the desktop app stay on your device unless you choose to save, export, upload, or share them somewhere else. GitHub release downloads are served by GitHub.",
  },
  {
    title: "Analytics",
    body: "The public website may use Vercel Analytics to understand basic page usage. This helps improve the site and download experience without reading your editor content.",
  },
  {
    title: "Third-party services",
    body: "The website links to GitHub Releases for downloads. GitHub and Vercel may process request data under their own privacy practices when you visit or download from them.",
  },
  {
    title: "Your choices",
    body: "You can clear browser storage to remove web drafts, delete downloaded installers, and choose not to use the web editor if you prefer the desktop app.",
  },
  {
    title: "Contact",
    body: "For privacy questions, open an issue or discussion in the nowtpad GitHub repository.",
  },
];

export function LegalPage({ kind }: LegalPageProps) {
  const isTerms = kind === "terms";
  const title = isTerms ? "Terms and Conditions" : "Privacy Policy";
  const sections = isTerms ? termsSections : privacySections;

  return (
    <main className="landing-page legal-page">
      <a className="skip-link" href="#legal-content">
        Skip to content
      </a>

      <section className="legal-hero" aria-labelledby="legal-title">
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

        <div className="legal-hero-inner">
          <p className="landing-release">Effective {effectiveDate}</p>
          <h1 id="legal-title">{title}</h1>
          <p className="legal-lede">
            Plain-language terms for using nowtpad and its download site.
          </p>
        </div>
      </section>

      <article id="legal-content" className="legal-content">
        {sections.map((section) => (
          <section key={section.title} className="legal-section">
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}

        <footer className="site-footer" aria-label="Site links">
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
          <a href="/downloads">Downloads</a>
          <a href="https://github.com/bokzgacilo/nowtpad">GitHub</a>
        </footer>
      </article>
    </main>
  );
}

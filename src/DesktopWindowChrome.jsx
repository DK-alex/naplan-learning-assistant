export function DesktopWindowChrome() {
  const desktopWindow = globalThis.window?.desktopWindow;
  if (!desktopWindow) return null;

  return (
    <div className="desktop-window-chrome" aria-label="Window controls">
      <div className="desktop-window-drag-region" aria-hidden="true" />
      <div className="desktop-window-actions">
        <button type="button" aria-label="Minimise" title="Minimise" onClick={() => desktopWindow.minimize()}>
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2 8.5h8" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Maximise or restore"
          title="Maximise or restore"
          onClick={() => desktopWindow.toggleMaximize()}
        >
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <rect x="2.25" y="2.25" width="7.5" height="7.5" rx=".3" />
          </svg>
        </button>
        <button
          type="button"
          className="desktop-window-close"
          aria-label="Close"
          title="Close"
          onClick={() => desktopWindow.close()}
        >
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path d="m2.4 2.4 7.2 7.2m0-7.2-7.2 7.2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

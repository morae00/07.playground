// The desktop app's window mode bridge (TEC-09, electron/preload.cjs). It exists only in the desktop app; the web
// build and the tests get null, and the setting then does not show.
export type DesktopWindow = Readonly<{
  fullScreen(): Promise<boolean>;
  setFullScreen(on: boolean): Promise<boolean>;
  onFullScreen(listener: (on: boolean) => void): () => void;
}>;

export function desktopWindow(host: unknown = globalThis): DesktopWindow | null {
  const bridge = (host as { blacklineDesktop?: Partial<DesktopWindow> } | null)?.blacklineDesktop;
  return bridge && typeof bridge.fullScreen === 'function' && typeof bridge.setFullScreen === 'function' && typeof bridge.onFullScreen === 'function'
    ? (bridge as DesktopWindow)
    : null;
}

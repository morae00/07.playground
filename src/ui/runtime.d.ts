interface ImportMeta {
  readonly env?: {
    readonly DEV?: boolean;
  };
}

declare const __APP_VERSION__: string;
declare const __DEVELOPER_UI_AVAILABLE__: boolean;
declare const __DEVELOPER_UI_DEFAULT_ENABLED__: boolean;
/** False in builds: content modules skip their load-time invariant checks (src/content/checks.ts). */
declare const __CONTENT_CHECKS__: boolean;

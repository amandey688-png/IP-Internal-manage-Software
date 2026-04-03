/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_URL: string
  readonly VITE_APP_NAME: string
  /** Default: proxy on. Set to "0" for direct browser → VITE_API_BASE_URL in dev */
  readonly VITE_DEV_SAME_ORIGIN_PROXY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

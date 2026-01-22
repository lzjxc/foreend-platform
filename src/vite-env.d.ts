/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SERVICE_ID: string;
  readonly VITE_LLM_GATEWAY_URL: string;
  readonly VITE_FILE_GATEWAY_URL: string;
  readonly VITE_NOTIFICATION_URL: string;
  readonly VITE_PDF_SERVICE_URL: string;
  readonly VITE_DATA_FETCHER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CYRANO_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;

}
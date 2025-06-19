export {};

declare global {
  interface Window {
    saveToHistory: (desc: string, lib: string, code: string) => void;
  }
} 
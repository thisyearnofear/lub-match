declare global {
  interface Window {
    searchTimeout?: NodeJS.Timeout;
  }
}

export {};
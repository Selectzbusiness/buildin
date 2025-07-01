/// <reference types="react-scripts" />

declare module 'react-dom/client' {
  export function createRoot(
    container: Element | DocumentFragment,
    options?: { hydrate?: boolean }
  ): {
    render(element: React.ReactElement): void;
    unmount(): void;
  };
} 
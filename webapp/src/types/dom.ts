import type React from "react";

/**
 * Type alias for DOM element RefObject, useful for function parameters.
 *
 * @example
 * function MyComponent({ containerRef }: { containerRef: DomRef<HTMLDivElement> }) {
 *     // ...
 * }
 */
export type DomRef<T extends HTMLElement> = React.RefObject<T | null>;

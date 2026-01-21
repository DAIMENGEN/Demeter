import { useRef } from "react";

/**
 * A convenience hook for creating refs to DOM elements.
 * Simplifies the verbose `useRef<HTMLElement | null>(null)` pattern.
 *
 * @example
 * // Instead of:
 * const divRef = useRef<HTMLDivElement | null>(null);
 *
 * // You can write:
 * const divRef = useDomRef<HTMLDivElement>();
 *
 * @returns A RefObject compatible with JSX ref attributes
 */
export function useDomRef<T extends HTMLElement>() {
    return useRef<T | null>(null);
}

/**
 * Type alias for DOM element RefObject, useful for function parameters.
 *
 * @example
 * function MyComponent({ containerRef }: { containerRef: DomRef<HTMLDivElement> }) {
 *     // ...
 * }
 */
export type DomRef<T extends HTMLElement> = React.RefObject<T | null>;

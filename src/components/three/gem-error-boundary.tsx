"use client";

import { Component, type ReactNode } from "react";

interface GemErrorBoundaryProps {
  children: ReactNode;
}

interface GemErrorBoundaryState {
  failed: boolean;
}

/**
 * Safety net for the WebGL canvas: if the browser cannot create a GL
 * context (or the gem throws at runtime) we silently render nothing —
 * the hero's CSS/SVG gem fallback stays visible instead.
 */
export class GemErrorBoundary extends Component<
  GemErrorBoundaryProps,
  GemErrorBoundaryState
> {
  state: GemErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): GemErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown): void {
    // WebGL unsupported / context lost — degrade gracefully to the 2D fallback.
    console.error("[jj-onyx] 3D gem unavailable, using 2D fallback:", error);
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

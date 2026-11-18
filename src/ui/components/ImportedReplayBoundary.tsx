import { Component, type ReactNode } from "react";

export class ImportedReplayBoundary extends Component<
  { onError(): void; children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch() {
    this.props.onError();
  }
  override render() {
    return this.state.failed ? (
      <p role="alert">This hand could not be displayed.</p>
    ) : (
      this.props.children
    );
  }
}

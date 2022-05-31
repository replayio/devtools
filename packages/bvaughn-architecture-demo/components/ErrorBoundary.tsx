import React, { Component, PropsWithChildren } from "react";

import styles from "./ErrorBoundary.module.css";

type ErrorBoundaryState = { error: Error | null };

export default class ErrorBoundary extends Component<PropsWithChildren<{}>, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  render() {
    const { error } = this.state;

    if (error !== null) {
      return <pre className={styles.Error}>{error.stack}</pre>;
    }

    return this.props.children;
  }
}

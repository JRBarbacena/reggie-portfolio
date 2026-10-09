import { Component } from "react";

export default class AppErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("Portfolio render failed", { name: error?.name });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main id="main" className="react-page not-found-page">
        <section className="card" aria-labelledby="recovery-title">
          <p className="react-eyebrow">Recovery</p>
          <h1 id="recovery-title">This page hit an unexpected problem.</h1>
          <p>Your content is safe. Reload the portfolio to try again.</p>
          <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>Reload portfolio</button>
        </section>
      </main>
    );
  }
}

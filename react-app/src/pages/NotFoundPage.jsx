import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <main id="main" className="error-main content-column">
      <section className="error-card card" aria-labelledby="error-title" data-reveal>
        <p className="error-card__code">Error 404</p>
        <h1 id="error-title">Page not found.</h1>
        <p className="error-card__copy">
          This route does not exist or may have moved. Head back home and pick up from there.
        </p>
        <Link className="btn btn-primary" to="/">Return home</Link>
      </section>
    </main>
  );
}

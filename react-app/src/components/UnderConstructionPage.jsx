import { Link } from "react-router-dom";
import "./UnderConstructionPage.css";

export default function UnderConstructionPage({ destination, title, description }) {
  return (
    <main id="main" className="under-construction">
      <section className="under-construction__panel" aria-labelledby="construction-title">
        <div className="under-construction__copy">
          <p className="under-construction__eyebrow"><span aria-hidden="true" /> {destination} / Work in progress</p>
          <h1 id="construction-title">{title} is under construction<span>.</span></h1>
          <p className="under-construction__description">{description}</p>
          <p className="under-construction__note">I&apos;m working on this page. Please check back soon.</p>
          <div className="under-construction__actions">
            <Link className="btn btn-primary" to="/tech">Explore Tech</Link>
            <Link className="under-construction__home" to="/">Back to Home <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
        <div className="under-construction__graphic" aria-hidden="true">
          <span className="under-construction__graphic-ring" />
          <span className="under-construction__graphic-mark">RB</span>
          <span className="under-construction__graphic-caption">A new chapter is taking shape</span>
        </div>
      </section>
    </main>
  );
}

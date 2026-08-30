import { CoffeeIcon, HouseLineIcon, MotorcycleIcon, VolleyballIcon } from "@phosphor-icons/react";
import PublishedAlbumSection from "../components/PublishedAlbumSection.jsx";

const rhythms = [
  {
    Icon: VolleyballIcon,
    eyebrow: "On the court",
    title: "Opposite hitter",
    copy: "Fast rallies, close games, and the kind of teamwork that makes every point feel earned.",
  },
  {
    Icon: MotorcycleIcon,
    eyebrow: "On the road",
    title: "NMAX & Vespa Classic",
    copy: "A quiet ride creates room to think, reset, and notice more of the route between destinations.",
  },
  {
    Icon: CoffeeIcon,
    eyebrow: "At the table",
    title: "White Chocolate Mocha",
    copy: "A dependable order, a slower pace, and better conversations with the right people around.",
  },
];

export default function LifePage() {
  return (
    <main id="main" className="content-column life-redesign">
      <section className="story-hero life-hero" aria-labelledby="life-title">
        <div className="story-hero__copy" data-reveal>
          <p className="story-kicker"><span>Beyond the screen</span></p>
          <h1 id="life-title">Life feels better <em>in motion.</em></h1>
          <p className="hero__lead">
            Away from code and classes, I recharge through sport, open roads, familiar coffee, and the people who make ordinary days memorable.
          </p>
          <dl className="story-stats" aria-label="Life at a glance">
            <div><dt>Home</dt><dd>Rizal</dd></div>
            <div><dt>Position</dt><dd>Opposite</dd></div>
            <div><dt>Reset</dt><dd>Ride</dd></div>
          </dl>
        </div>

        <div className="story-hero__visual life-visual life-collage" data-reveal data-reveal-delay="2">
          <figure className="life-collage__photo life-collage__photo--main card">
            <img src="/images/photos/Patawow_VB.JPG" alt="Reggie with his volleyball team" width="1536" height="2048" fetchPriority="high" />
          </figure>
          <figure className="life-collage__photo life-collage__photo--secondary card">
            <img src="/images/photos/Cursor_Cafe.JPG" alt="Reggie spending time at Café Cursor Manila" width="1536" height="2048" />
          </figure>
          <div className="life-collage__note neu-inset">
            <span>Current rhythm</span>
            <strong>Play. Pause.<br />Go again.</strong>
          </div>
          <p className="life-visual__tag">Find your pace</p>
        </div>
      </section>

      <section className="life-rhythm" aria-labelledby="life-rhythm-title">
        <SectionHead id="life-rhythm-title" title="What keeps me moving" copy="The interests that bring energy, balance, and perspective back into everything I build." />
        <div className="life-rhythm__grid">
          {rhythms.map(({ Icon, eyebrow, title, copy }, index) => (
            <article className="life-rhythm-card card" data-reveal data-reveal-delay={index || undefined} key={title}>
              <span className="life-rhythm-card__icon" aria-hidden="true"><Icon size={30} weight="duotone" /></span>
              <p className="timeline__meta">{eyebrow}</p>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="court-section" aria-labelledby="court-title">
        <SectionHead id="court-title" title="Better when it is played" copy="Fast rallies, open courts, close games, and the right crew." />
        <div className="life-gallery">
          <article className="life-shot life-shot--wide card" data-reveal>
            <figure>
              <img src="/images/photos/Patawow_VB.JPG" alt="Reggie standing with his volleyball teammates on an indoor court" width="2048" height="1536" loading="lazy" />
              <figcaption><span>Volleyball / The crew</span><strong>Show up. Play hard.</strong></figcaption>
            </figure>
          </article>
          <article className="life-shot card" data-reveal data-reveal-delay="1">
            <figure>
              <img src="/images/photos/champs_vb.JPG" alt="Reggie holding a championship trophy and medal after a volleyball match" width="1536" height="2048" loading="lazy" />
              <figcaption><span>Volleyball</span><strong>Worth the rally</strong></figcaption>
            </figure>
          </article>
          <article className="life-shot card" data-reveal data-reveal-delay="2">
            <figure>
              <img src="/images/photos/basketball.JPG" alt="Reggie wearing number one during a basketball game" width="1365" height="2048" loading="lazy" />
              <figcaption><span>Basketball</span><strong>Any open court</strong></figcaption>
            </figure>
          </article>
        </div>
      </section>

      <section className="small-wins" aria-labelledby="small-wins-title">
        <SectionHead id="small-wins-title" title="The everyday good stuff" copy="Simple rituals that make an ordinary day land just right." />
        <div className="small-wins__grid">
          <article className="coffee-story card" data-reveal>
            <img src="/images/photos/Cursor_Cafe.JPG" alt="Reggie holding a coffee at Café Cursor Manila" width="1536" height="2048" loading="lazy" />
            <div>
              <p className="timeline__meta">Usual order</p>
              <h3>White Chocolate Mocha</h3>
              <p>Cold, sweet, familiar—and usually better with a good conversation beside it.</p>
            </div>
          </article>
          <div className="home-card neu-inset" data-reveal data-reveal-delay="2">
            <div className="home-card__coordinates" aria-hidden="true"><HouseLineIcon size={22} weight="duotone" /><span>HOME BASE<br />SAN MATEO / PH</span></div>
            <div>
              <p className="timeline__meta">Home base</p>
              <h3>San Mateo, Rizal</h3>
              <p>Where I grew up, where I reset, and where every route begins.</p>
            </div>
            <span className="home-card__pulse" aria-hidden="true" />
          </div>
        </div>
      </section>

      <PublishedAlbumSection
        destination="life"
        id="life-albums"
        title="Life, lately"
        copy="Published snapshots from games, rides, coffee stops, and the moments between milestones."
        className="life-albums"
      />

      <section className="story-closing neu-inset" aria-label="Life philosophy" data-reveal>
        <blockquote>Not every moment has to be productive to be worth remembering.</blockquote>
        <span aria-hidden="true">PLAY / RIDE / RESET</span>
      </section>
    </main>
  );
}

function SectionHead({ id, title, copy }) {
  return <div className="section-head"><h2 id={id}>{title}</h2><p>{copy}</p></div>;
}

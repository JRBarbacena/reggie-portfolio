import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell.jsx";
import { routes } from "./site-data.js";
import "./runtime-session.js";

const HomePage = lazy(() => import("./pages/HomePage.jsx"));
const TechPage = lazy(() => import("./pages/TechPage.jsx"));
const TravelPage = lazy(() => import("./pages/TravelPage.jsx"));
const LifePage = lazy(() => import("./pages/LifePage.jsx"));
const AdminPage = lazy(() => import("./pages/AdminPage.jsx"));

function Page({ title, label }) {
  return (
    <main aria-labelledby="page-title">
      <section className="migration-page">
        <p className="migration-page__eyebrow">React migration foundation</p>
        <h1 id="page-title">{title}</h1>
        <p>
          The {label} experience will be migrated here only after its current
          route, semantics, interactions, and responsive behavior are preserved.
        </p>
      </section>
    </main>
  );
}

function NotFound() {
  return <Page label="not-found" title="Page not found." />;
}

export default function App() {
  return (
    <AppShell>
      <Suspense fallback={<main id="main" className="route-loading" aria-label="Loading page" />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tech" element={<TechPage />} />
          <Route path="/travel" element={<TravelPage />} />
          <Route path="/life" element={<LifePage />} />
          <Route path="/admin" element={<AdminPage />} />
          {routes.filter((page) => !["/", "/tech", "/travel", "/life"].includes(page.path)).map((page) => (
            <Route key={page.path} path={page.path} element={<Page {...page} />} />
          ))}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}

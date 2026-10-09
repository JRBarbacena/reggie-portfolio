import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import AppErrorBoundary from "./components/AppErrorBoundary.jsx";
import AppShell from "./components/AppShell.jsx";
import "./runtime-session.js";

const HomePage = lazy(() => import("./pages/HomePage.jsx"));
const TechPage = lazy(() => import("./pages/TechPage.jsx"));
const TravelPage = lazy(() => import("./pages/TravelPage.jsx"));
const LifePage = lazy(() => import("./pages/LifePage.jsx"));
const AdminPage = lazy(() => import("./pages/AdminPage.jsx"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.jsx"));

export default function App() {
  return (
    <AppErrorBoundary>
      <AppShell>
        <Suspense fallback={<main id="main" className="route-loading" aria-label="Loading page" />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/tech" element={<TechPage />} />
            <Route path="/travel" element={<TravelPage />} />
            <Route path="/life" element={<LifePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AppShell>
    </AppErrorBoundary>
  );
}

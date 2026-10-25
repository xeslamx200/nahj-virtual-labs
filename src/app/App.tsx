import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { I18nProvider, useI18n } from '../i18n/i18n';
import { UI } from '../i18n/ui';
import { BRAND } from '../config/brand';
import { Header } from './Header';
import Dashboard from '../pages/Dashboard';

const ElectricityLab = lazy(() => import('../labs/electricity/ElectricityLab'));
const MotionLab = lazy(() => import('../labs/motion/MotionLab'));
const HeatLab = lazy(() => import('../labs/heat/HeatLab'));
const ChemistryLab = lazy(() => import('../labs/chemistry/ChemistryLab'));
const ReportPage = lazy(() => import('../reports/ReportPage'));
const WorkshopPage = lazy(() => import('../workshop/WorkshopPage'));

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo?.(0, 0);
  }, [pathname]);
  return null;
}

function Shell() {
  const { t, lang } = useI18n();
  const title = t(UI.appName);
  useEffect(() => {
    document.title = title;
  }, [title]);
  return (
    <>
      <a href="#main" className="skip-link">
        {t(UI.skip)}
      </a>
      <Header />
      <main id="main" tabIndex={-1}>
        <Suspense fallback={<div className="container loading">…</div>}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/lab/electricity" element={<ElectricityLab />} />
            <Route path="/lab/motion" element={<MotionLab />} />
            <Route path="/lab/heat" element={<HeatLab />} />
            <Route path="/lab/chemistry" element={<ChemistryLab />} />
            <Route path="/report/:lab" element={<ReportPage />} />
            <Route path="/workshop" element={<WorkshopPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <footer className="app-footer no-print">
        <div className="container small muted">
          <span>{t(UI.appName)}</span>
          <span>·</span>
          <span>{BRAND.placeholderNote[lang]}</span>
        </div>
      </footer>
    </>
  );
}

export function App() {
  return (
    <I18nProvider>
      <HashRouter>
        <ScrollTop />
        <Shell />
      </HashRouter>
    </I18nProvider>
  );
}

import { NavLink } from 'react-router-dom';
import { BRAND } from '../config/brand';
import { useI18n } from '../i18n/i18n';
import { UI } from '../i18n/ui';
import { LABS, LAB_ORDER } from '../curriculum';
import { Icon } from '../components/Icon';

export function Header() {
  const { t, toggle } = useI18n();
  return (
    <header className="app-header no-print">
      <div className="container">
        <NavLink to="/" className="brand" aria-label={t(UI.appName)}>
          <span className="brand-mark" aria-hidden="true">
            {BRAND.monogram}
          </span>
          <span className="brand-text">
            <strong>{t(UI.appName)}</strong>
            <small>{t(UI.grade)}</small>
          </span>
        </NavLink>
        <nav className="main-nav" aria-label="Main">
          {LAB_ORDER.map((id) => (
            <NavLink key={id} to={LABS[id].path}>
              <Icon name={LABS[id].icon} /> <span className="nav-long">{t(LABS[id].info.title)}</span>
            </NavLink>
          ))}
          <NavLink to="/workshop">
            <Icon name="present" /> <span className="nav-long">{t(UI.workshop)}</span>
          </NavLink>
        </nav>
        <div className="header-actions">
          <button type="button" className="btn btn-sm" onClick={toggle} aria-label={t(UI.languageLabel)} data-testid="lang-toggle">
            <Icon name="globe" /> {t(UI.language)}
          </button>
        </div>
      </div>
    </header>
  );
}

import { useState, useEffect, useRef, Suspense, lazy } from 'react';

import { LedgerProvider, useLedger } from './hooks/useLedger.jsx';
import { exportToJSON, importFromJSON } from './lib/storage.js';
import Dashboard from './pages/Dashboard.jsx';
import Transactions from './pages/Transactions.jsx';
import './App.css';

/**
 * Lazy-load the Budgets page for code splitting.
 * Requirements: 9.1
 */
const Budgets = lazy(() => import('./pages/Budgets.jsx'));

/**
 * Resolve the current route from the URL hash.
 * Returns one of: 'dashboard' | 'transactions' | 'budgets'
 */
function getRouteFromHash(hash) {
  if (hash === '#/transactions') return 'transactions';
  if (hash === '#/budgets') return 'budgets';
  return 'dashboard'; // '#/', '#', or anything unrecognised → Dashboard
}

/**
 * Inner app shell — must be inside LedgerProvider so it can call useLedger().
 * Handles routing, nav bar, export/import, and error banners.
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.4
 */
function AppInner() {
  const { state, dispatch, storageError, clearStorageError, resetData } = useLedger();
  const [route, setRoute] = useState(() => getRouteFromHash(window.location.hash));
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  // Listen for hash changes (back/forward navigation and link clicks)
  useEffect(() => {
    function handleHashChange() {
      setRoute(getRouteFromHash(window.location.hash));
    }
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // ── Export ────────────────────────────────────────────────────────────────
  function handleExport() {
    const json = exportToJSON(state);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-export-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Import ────────────────────────────────────────────────────────────────
  function handleImportClick() {
    setImportError(null);
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    // Reset input so the same file can be re-selected if needed
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const contents = evt.target.result;

      const confirmed = window.confirm(
        'Importing will overwrite all existing data. Continue?'
      );
      if (!confirmed) return;

      const result = importFromJSON(contents);
      if (result.success) {
        dispatch({ type: 'IMPORT_STATE', payload: result.data });
        setImportError(null);
      } else {
        setImportError(`Import failed: ${result.error}`);
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="app">
      {/* Storage error banner */}
      {storageError && (
        <div className="error-banner" role="alert" aria-live="assertive">
          <span className="error-banner__message">{storageError}</span>
          <button
            type="button"
            className="error-banner__reset"
            onClick={resetData}
          >
            Reset data
          </button>
          <button
            type="button"
            className="error-banner__dismiss"
            onClick={clearStorageError}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Import error notice */}
      {importError && (
        <div className="error-banner" role="alert" aria-live="assertive">
          <span className="error-banner__message">{importError}</span>
          <button
            type="button"
            className="error-banner__dismiss"
            onClick={() => setImportError(null)}
            aria-label="Dismiss import error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation bar */}
      <nav className="nav" aria-label="Main navigation">
        <div className="nav__brand">💰 Ledger</div>
        <ul className="nav__links" role="list">
          <li>
            <a
              href="#/"
              className={`nav__link${route === 'dashboard' ? ' nav__link--active' : ''}`}
              aria-current={route === 'dashboard' ? 'page' : undefined}
            >
              Dashboard
            </a>
          </li>
          <li>
            <a
              href="#/transactions"
              className={`nav__link${route === 'transactions' ? ' nav__link--active' : ''}`}
              aria-current={route === 'transactions' ? 'page' : undefined}
            >
              Transactions
            </a>
          </li>
          <li>
            <a
              href="#/budgets"
              className={`nav__link${route === 'budgets' ? ' nav__link--active' : ''}`}
              aria-current={route === 'budgets' ? 'page' : undefined}
            >
              Budgets
            </a>
          </li>
        </ul>

        {/* Export / Import actions */}
        <div className="nav__actions">
          <button
            type="button"
            className="nav__action-btn"
            onClick={handleExport}
            title="Export data as JSON"
          >
            Export
          </button>
          <button
            type="button"
            className="nav__action-btn"
            onClick={handleImportClick}
            title="Import data from JSON file"
          >
            Import
          </button>
          {/* Hidden file input — triggered programmatically */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            aria-hidden="true"
          />
        </div>
      </nav>

      {/* Page content */}
      <div className="app__content">
        <Suspense fallback={<div className="app__loading" aria-live="polite">Loading…</div>}>
          {route === 'dashboard' && <Dashboard />}
          {route === 'transactions' && <Transactions />}
          {route === 'budgets' && <Budgets />}
        </Suspense>
      </div>
    </div>
  );
}

/**
 * App root — wraps everything in LedgerProvider.
 * Requirements: 9.1, 9.4
 */
export default function App() {
  return (
    <LedgerProvider>
      <AppInner />
    </LedgerProvider>
  );
}

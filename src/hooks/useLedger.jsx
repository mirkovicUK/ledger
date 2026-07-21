import { useReducer, useEffect, useMemo, useState, createContext, useContext } from 'react';
import { ledgerReducer, INITIAL_STATE } from '../lib/ledgerReducer.js';
import { saveState, loadState, clearState } from '../lib/storage.js';
import { generateId } from '../lib/id.js';
import { totalBalance, accountBalance } from '../lib/money.js';

export const LedgerContext = createContext(null);

export function useLedger() {
  return useContext(LedgerContext);
}

export function LedgerProvider({ children }) {
  const [state, dispatch] = useReducer(ledgerReducer, INITIAL_STATE);
  const [storageError, setStorageError] = useState(null);

  // Load persisted state on mount; surface an error if load fails after a
  // previous session existed (i.e. loadState returns null unexpectedly).
  useEffect(() => {
    loadState().then(saved => {
      if (saved) {
        dispatch({ type: 'IMPORT_STATE', payload: saved });
      }
    }).catch(() => {
      setStorageError('Failed to load your saved data. It may be corrupted or unavailable.');
    });
  }, []);

  // Persist state on every change; surface an error if save fails
  useEffect(() => {
    saveState(state).catch(() => {
      setStorageError('Failed to save your data. Changes may not be persisted.');
    });
  }, [state]);

  // Expand recurring rules on mount and when recurringRules change
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    dispatch({
      type: 'EXPAND_RECURRING_RULES',
      payload: { referenceDate: today, idGenerator: generateId },
    });
  }, [state.recurringRules]);

  // Memoized selectors
  const totalBal = useMemo(() => totalBalance(state.transactions), [state.transactions]);
  const accountBalances = useMemo(() => {
    return Object.fromEntries(
      state.accounts.map(a => [a.id, accountBalance(state.transactions, a.id)])
    );
  }, [state.accounts, state.transactions]);

  /** Clear the error banner without resetting data */
  function clearStorageError() {
    setStorageError(null);
  }

  /** Wipe persisted storage and reset in-memory state to empty */
  async function resetData() {
    try {
      await clearState();
    } catch {
      // best-effort — proceed with in-memory reset regardless
    }
    dispatch({ type: 'RESET_STATE' });
    setStorageError(null);
  }

  const value = {
    state,
    dispatch,
    totalBalance: totalBal,
    accountBalances,
    storageError,
    clearStorageError,
    resetData,
  };

  return (
    <LedgerContext.Provider value={value}>
      {children}
    </LedgerContext.Provider>
  );
}

import { useReducer, useEffect, useMemo, useState, createContext, useContext } from 'react';
import { ledgerReducer, INITIAL_STATE } from '../lib/ledgerReducer.js';
import { saveState, loadState, clearState } from '../lib/storage.js';
import { generateId } from '../lib/id.js';
import { totalBalance, accountBalance } from '../lib/money.js';
import type { AppState } from '../lib/types.js';
import type React from 'react';

export const LedgerContext = createContext<null | {
  state: AppState;
  dispatch: React.Dispatch<{ type: string; payload?: unknown }>;
  totalBalance: number;
  accountBalances: Record<string, number>;
  storageError: string | null;
  clearStorageError: () => void;
  resetData: () => Promise<void>;
}>(null);

export function useLedger() {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error('useLedger must be used within a LedgerProvider');
  }
  return context;
}

export function LedgerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(ledgerReducer, INITIAL_STATE);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    loadState().then((saved) => {
      if (saved) {
        dispatch({ type: 'IMPORT_STATE', payload: saved });
      }
    }).catch(() => {
      setStorageError('Failed to load your saved data. It may be corrupted or unavailable.');
    });
  }, []);

  useEffect(() => {
    saveState(state).catch(() => {
      setStorageError('Failed to save your data. Changes may not be persisted.');
    });
  }, [state]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    dispatch({
      type: 'EXPAND_RECURRING_RULES',
      payload: { referenceDate: today, idGenerator: generateId },
    });
  }, [state.recurringRules]);

  const totalBal = useMemo(() => totalBalance(state.transactions), [state.transactions]);
  const accountBalances = useMemo(() => {
    return Object.fromEntries(
      state.accounts.map((a) => [a.id, accountBalance(state.transactions, a.id)])
    );
  }, [state.accounts, state.transactions]);

  function clearStorageError() {
    setStorageError(null);
  }

  async function resetData() {
    try {
      await clearState();
    } catch {
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
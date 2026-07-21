import { computeBudgetSpending } from '../src/lib/budget.js';
import { periodStart, periodEnd, isWithinRange } from '../src/lib/date.js';
import { applyFilters } from '../src/lib/filter.js';
import { exportToJSON, importFromJSON } from '../src/lib/storage.js';
import { sortTransactions } from '../src/lib/sort.js';
import { expandRule } from '../src/lib/recurring.js';

// ---------------------------------------------------------------------------
// Property 3: Budget spending equals sum of matching transactions in period
// Validates: Requirements 4.4, 4.5
// ---------------------------------------------------------------------------

describe('Property 3: Budget spending equals sum of matching transactions in period', () => {
  // Fixed reference date used across all iterations
  const REF_DATE = '2024-06-15';
  const PERIODS = ['weekly', 'monthly', 'yearly'];
  const CATEGORIES = ['cat-food', 'cat-transport', 'cat-utilities'];

  /**
   * Deterministic pseudo-random number generator (mulberry32) seeded per
   * iteration, so failures are reproducible.
   */
  function makePrng(seed) {
    let s = seed >>> 0;
    return function () {
      s += 0x6d2b79f5;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Pick a random item from an array.
   */
  function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
  }

  /**
   * Generate a YYYY-MM-DD string for a date that is `offsetDays` from
   * 2024-01-01 (±182 days around REF_DATE 2024-06-15, i.e. within 1 year).
   */
  function randomDateString(rng) {
    // 1-year window: 2024-01-01 to 2024-12-31 (366 days, 2024 is leap)
    const base = new Date('2024-01-01T00:00:00Z');
    const offsetDays = Math.floor(rng() * 366);
    const d = new Date(base.getTime() + offsetDays * 86400000);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * Generate between 0 and 20 random transactions.
   * Amounts are in [-500, 1000]; categoryId is from CATEGORIES ∪ {null}.
   */
  function generateTransactions(rng, count) {
    const txs = [];
    for (let i = 0; i < count; i++) {
      // Amount: rng() * 1500 − 500  →  [-500, 1000]
      const amount = rng() * 1500 - 500;
      // 1/4 chance of null category to exercise the zero-spend edge case
      const categoryId = rng() < 0.25 ? null : pick(rng, CATEGORIES);
      txs.push({
        id: `tx-${i}`,
        accountId: 'acc-1',
        amount,
        date: randomDateString(rng),
        description: `tx ${i}`,
        categoryId,
        createdAt: new Date().toISOString(),
      });
    }
    return txs;
  }

  /**
   * Manually compute expected spending: filter by categoryId AND date within
   * period, then sum amounts.
   */
  function manualSpending(budget, transactions, refDate) {
    const start = periodStart(refDate, budget.period);
    const end = periodEnd(refDate, budget.period);
    return transactions
      .filter(
        t =>
          t.categoryId === budget.categoryId &&
          isWithinRange(t.date, start, end),
      )
      .reduce((sum, t) => sum + t.amount, 0);
  }

  test('computeBudgetSpending matches manual filter+sum for 100 random inputs', () => {
    const ITERATIONS = 100;

    for (let i = 0; i < ITERATIONS; i++) {
      const rng = makePrng(i * 7919 + 1); // deterministic seed per iteration

      const period = pick(rng, PERIODS);
      const categoryId = pick(rng, CATEGORIES);

      const budget = {
        id: `budget-${i}`,
        categoryId,
        limit: 500,
        period,
        startDate: REF_DATE,
      };

      // 0–20 transactions
      const txCount = Math.floor(rng() * 21);
      const transactions = generateTransactions(rng, txCount);

      const actual = computeBudgetSpending(budget, transactions, REF_DATE);
      const expected = manualSpending(budget, transactions, REF_DATE);

      expect(actual).toBeCloseTo(expected, 8);
    }
  });

  test('computeBudgetSpending returns 0 when no transactions match budget category', () => {
    // Requirement 4.5: zero spending when no matching transactions
    const ITERATIONS = 100;

    for (let i = 0; i < ITERATIONS; i++) {
      const rng = makePrng(i * 3571 + 42);

      const period = pick(rng, PERIODS);
      // Budget uses a category that never appears in transactions
      const budget = {
        id: `budget-zero-${i}`,
        categoryId: 'cat-nonexistent',
        limit: 200,
        period,
        startDate: REF_DATE,
      };

      const txCount = Math.floor(rng() * 21);
      const transactions = generateTransactions(rng, txCount);

      const actual = computeBudgetSpending(budget, transactions, REF_DATE);
      expect(actual).toBe(0);
    }
  });
});

import { ledgerReducer, INITIAL_STATE } from '../src/lib/ledgerReducer.js';

// ---------------------------------------------------------------------------
// Helpers for Property 2
// ---------------------------------------------------------------------------

function p2RandInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function p2RandItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------------
// Property 2: Cascade delete removes account and all associated transactions
// Validates: Requirements 1.4
// ---------------------------------------------------------------------------

describe('Property 2: Cascade delete removes account and all associated transactions', () => {
  test('dispatching DELETE_ACCOUNT removes the account and all its transactions across 100 random states', () => {
    for (let iteration = 0; iteration < 100; iteration++) {
      // Build state with 1-4 accounts
      const accountCount = p2RandInt(1, 4);
      const accounts = [];
      for (let i = 0; i < accountCount; i++) {
        const types = ['checking', 'savings', 'credit', 'cash', 'investment'];
        accounts.push({
          id: `acc-p2-${iteration}-${i}`,
          name: `Account ${i}`,
          type: p2RandItem(types),
          createdAt: new Date().toISOString(),
        });
      }

      // Build 5-15 transactions assigned to random accounts
      const txnCount = p2RandInt(5, 15);
      const transactions = [];
      for (let j = 0; j < txnCount; j++) {
        const account = p2RandItem(accounts);
        transactions.push({
          id: `txn-p2-${iteration}-${j}`,
          accountId: account.id,
          amount: parseFloat((Math.random() * 1000 - 500).toFixed(2)),
          date: '2024-01-15',
          description: `Transaction ${j}`,
          categoryId: null,
          recurringRuleId: null,
          createdAt: new Date().toISOString(),
        });
      }

      const state = {
        ...INITIAL_STATE,
        accounts,
        transactions,
      };

      // Pick a random account to delete
      const targetAccount = p2RandItem(accounts);
      const targetId = targetAccount.id;

      // Dispatch DELETE_ACCOUNT
      const nextState = ledgerReducer(state, {
        type: 'DELETE_ACCOUNT',
        payload: { id: targetId },
      });

      // Condition 1: the account is absent from state.accounts
      const accountStillPresent = nextState.accounts.some((a) => a.id === targetId);
      expect(accountStillPresent).toBe(false);

      // Condition 2: no transaction references the deleted accountId
      const orphanedTxn = nextState.transactions.find((t) => t.accountId === targetId);
      expect(orphanedTxn).toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// Property 8: Filter results satisfy all applied criteria
// Validates: Requirements 6.1, 6.3
// ---------------------------------------------------------------------------

describe('Property 8: Filter results satisfy all applied criteria', () => {
  /**
   * For any list of transactions and any combination of filter criteria,
   * every transaction in applyFilters(transactions, criteria) satisfies
   * ALL non-null criteria simultaneously (AND logic).
   *
   * **Validates: Requirements 6.1, 6.3**
   */

  const P8_ACCOUNT_IDS = ['acct-1', 'acct-2', 'acct-3'];
  const P8_CATEGORY_IDS = ['cat-1', 'cat-2', 'cat-3', null];

  function p8RandInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function p8RandFloat(min, max) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
  }

  function p8Pad(n) {
    return String(n).padStart(2, '0');
  }

  function p8RandomDate2024() {
    const month = p8RandInt(1, 12);
    const day = p8RandInt(1, 28);
    return `2024-${p8Pad(month)}-${p8Pad(day)}`;
  }

  function p8GenerateTransactions() {
    const count = p8RandInt(5, 25);
    return Array.from({ length: count }, (_, i) => ({
      id: `tx-p8-${i}`,
      accountId: P8_ACCOUNT_IDS[p8RandInt(0, P8_ACCOUNT_IDS.length - 1)],
      categoryId: P8_CATEGORY_IDS[p8RandInt(0, P8_CATEGORY_IDS.length - 1)],
      date: p8RandomDate2024(),
      amount: p8RandFloat(-500, 1000),
      description: `Transaction ${i}`,
    }));
  }

  function p8GenerateCriteria() {
    const criteria = {
      accountId: null,
      categoryId: null,
      dateRange: null,
      amountRange: null,
    };

    // accountId: null or one of the 3 account ids
    if (Math.random() < 0.5) {
      criteria.accountId = P8_ACCOUNT_IDS[p8RandInt(0, P8_ACCOUNT_IDS.length - 1)];
    }

    // categoryId: null, one of the 3 real category ids, or 'uncategorized'
    if (Math.random() < 0.5) {
      const roll = Math.random();
      if (roll < 0.6) {
        criteria.categoryId = ['cat-1', 'cat-2', 'cat-3'][p8RandInt(0, 2)];
      } else {
        criteria.categoryId = 'uncategorized';
      }
    }

    // dateRange: null or random from/to within 2024
    if (Math.random() < 0.5) {
      const fromMonth = p8RandInt(1, 6);
      const toMonth = p8RandInt(7, 12);
      const fromDay = p8RandInt(1, 28);
      const toDay = p8RandInt(1, 28);
      criteria.dateRange = {
        from: `2024-${p8Pad(fromMonth)}-${p8Pad(fromDay)}`,
        to: `2024-${p8Pad(toMonth)}-${p8Pad(toDay)}`,
      };
    }

    // amountRange: null or random min/max
    if (Math.random() < 0.5) {
      const min = p8RandFloat(-500, 250);
      const max = p8RandFloat(min, 1000);
      criteria.amountRange = { min, max };
    }

    return criteria;
  }

  test('every result satisfies ALL non-null criteria across 100 random cases', () => {
    for (let iteration = 0; iteration < 100; iteration++) {
      const transactions = p8GenerateTransactions();
      const criteria = p8GenerateCriteria();
      const results = applyFilters(transactions, criteria);

      for (const t of results) {
        // accountId criterion
        if (criteria.accountId != null) {
          expect(t.accountId).toBe(criteria.accountId);
        }

        // categoryId criterion
        if (criteria.categoryId != null) {
          const effectiveCategory = t.categoryId ?? 'uncategorized';
          expect(effectiveCategory).toBe(criteria.categoryId);
        }

        // dateRange criterion
        if (criteria.dateRange != null) {
          expect(t.date >= criteria.dateRange.from).toBe(true);
          expect(t.date <= criteria.dateRange.to).toBe(true);
        }

        // amountRange criterion
        if (criteria.amountRange != null) {
          expect(t.amount).toBeGreaterThanOrEqual(criteria.amountRange.min);
          expect(t.amount).toBeLessThanOrEqual(criteria.amountRange.max);
        }
      }
    }
  });

  test('null criteria returns all transactions unchanged across 100 random cases', () => {
    for (let iteration = 0; iteration < 100; iteration++) {
      const transactions = p8GenerateTransactions();
      const nullCriteria = {
        accountId: null,
        categoryId: null,
        dateRange: null,
        amountRange: null,
      };
      const results = applyFilters(transactions, nullCriteria);
      expect(results).toHaveLength(transactions.length);
    }
  });
});

// ---------------------------------------------------------------------------
// Property 9: Sort results are correctly ordered
// Validates: Requirements 6.2
// ---------------------------------------------------------------------------

describe('Property 9: Sort results are correctly ordered', () => {
  /**
   * For any sorted array, every adjacent pair (result[i], result[i+1])
   * satisfies the ordering constraint for the given field and direction.
   *
   * **Validates: Requirements 6.2**
   */

  const FIELDS = ['date', 'amount', 'description'];
  const DIRECTIONS = ['asc', 'desc'];

  function p9RandInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function p9RandFloat(min, max) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2));
  }

  function p9Pad(n) {
    return String(n).padStart(2, '0');
  }

  /** Random YYYY-MM-DD in 2024 */
  function p9RandomDate2024() {
    const month = p9RandInt(1, 12);
    const day = p9RandInt(1, 28);
    return `2024-${p9Pad(month)}-${p9Pad(day)}`;
  }

  /** Random alphanumeric string of length 4-12 */
  function p9RandomDescription() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const len = p9RandInt(4, 12);
    let s = '';
    for (let i = 0; i < len; i++) {
      s += chars[p9RandInt(0, chars.length - 1)];
    }
    return s;
  }

  /** Generate 2–15 random transactions */
  function p9GenerateTransactions() {
    const count = p9RandInt(2, 15);
    return Array.from({ length: count }, (_, i) => ({
      id: `tx-p9-${i}`,
      accountId: 'acc-1',
      amount: p9RandFloat(-500, 1000),
      date: p9RandomDate2024(),
      description: p9RandomDescription(),
      categoryId: null,
      createdAt: new Date().toISOString(),
    }));
  }

  /**
   * Compare two values for the given field and return a number following
   * the same sign convention as Array.prototype.sort comparators:
   *   < 0 → a before b
   *   = 0 → equal
   *   > 0 → b before a
   */
  function compareValues(a, b, field) {
    if (field === 'amount') {
      return a.amount - b.amount;
    }
    // date and description: lexicographic
    const aVal = a[field] ?? '';
    const bVal = b[field] ?? '';
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
    return 0;
  }

  test('every adjacent pair satisfies the ordering constraint across 100 random inputs', () => {
    const ITERATIONS = 100;

    for (let iteration = 0; iteration < ITERATIONS; iteration++) {
      const transactions = p9GenerateTransactions();
      const field = FIELDS[p9RandInt(0, FIELDS.length - 1)];
      const direction = DIRECTIONS[p9RandInt(0, DIRECTIONS.length - 1)];

      const result = sortTransactions(transactions, { field, direction });

      // Verify pairwise ordering invariant for all adjacent pairs
      for (let i = 0; i < result.length - 1; i++) {
        const cmp = compareValues(result[i], result[i + 1], field);

        if (direction === 'asc') {
          // result[i] should be <= result[i+1]
          expect(cmp).toBeLessThanOrEqual(0);
        } else {
          // direction === 'desc': result[i] should be >= result[i+1]
          expect(cmp).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  test('input array is not mutated after sorting', () => {
    const ITERATIONS = 100;

    for (let iteration = 0; iteration < ITERATIONS; iteration++) {
      const transactions = p9GenerateTransactions();
      const original = transactions.map(t => ({ ...t }));
      const field = FIELDS[p9RandInt(0, FIELDS.length - 1)];
      const direction = DIRECTIONS[p9RandInt(0, DIRECTIONS.length - 1)];

      sortTransactions(transactions, { field, direction });

      // Original array must be unchanged
      expect(transactions).toHaveLength(original.length);
      for (let i = 0; i < original.length; i++) {
        expect(transactions[i].id).toBe(original[i].id);
        expect(transactions[i].amount).toBe(original[i].amount);
        expect(transactions[i].date).toBe(original[i].date);
        expect(transactions[i].description).toBe(original[i].description);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Property 10: Export/import roundtrip preserves all data
// Validates: Requirements 8.6
// ---------------------------------------------------------------------------

describe('Property 10: Export/import roundtrip preserves all data', () => {
  /**
   * For any valid AppState, exportToJSON followed by importFromJSON must
   * return { success: true, data } where data deeply equals the original state.
   *
   * **Validates: Requirements 8.6**
   */

  const ACCOUNT_TYPES = ['checking', 'savings', 'credit', 'cash', 'investment'];
  const FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'];
  const PERIODS = ['weekly', 'monthly', 'yearly'];

  /** Deterministic pseudo-random number generator (mulberry32). */
  function makePrng(seed) {
    let s = seed >>> 0;
    return function () {
      s += 0x6d2b79f5;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
  }

  function randInt(rng, min, max) {
    return Math.floor(rng() * (max - min + 1)) + min;
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  /** Generate a YYYY-MM-DD string within 2020-2024. */
  function randomDate(rng) {
    const year = 2020 + randInt(rng, 0, 4);
    const month = randInt(rng, 1, 12);
    const day = randInt(rng, 1, 28);
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  /** Generate a valid ISO datetime string. */
  function randomDatetime(rng) {
    return `${randomDate(rng)}T${pad(randInt(rng, 0, 23))}:${pad(randInt(rng, 0, 59))}:${pad(randInt(rng, 0, 59))}.000Z`;
  }

  /** Generate a finite non-NaN amount in [-9999, 9999], 2 decimal places. */
  function randomAmount(rng) {
    return Math.round((rng() * 19998 - 9999) * 100) / 100;
  }

  /** Generate a random alphanumeric string of given length. */
  function randomString(rng, len, prefix = '') {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let s = prefix;
    for (let i = 0; i < len; i++) {
      s += chars[Math.floor(rng() * chars.length)];
    }
    return s;
  }

  /**
   * Build a valid AppState with:
   *  - 1–3 accounts
   *  - 0–5 transactions (with valid accountIds)
   *  - 0–3 categories
   *  - 0–2 budgets (referencing generated categories)
   *  - 0–2 recurring rules (referencing generated accounts)
   */
  function generateAppState(rng, iteration) {
    // --- accounts ---
    const accountCount = randInt(rng, 1, 3);
    const accounts = [];
    for (let i = 0; i < accountCount; i++) {
      accounts.push({
        id: `acc-p10-${iteration}-${i}`,
        name: `Account ${randomString(rng, 4)}`,
        type: pick(rng, ACCOUNT_TYPES),
        createdAt: randomDatetime(rng),
      });
    }

    // --- categories ---
    const categoryCount = randInt(rng, 0, 3);
    const categories = [];
    for (let i = 0; i < categoryCount; i++) {
      categories.push({
        id: `cat-p10-${iteration}-${i}`,
        name: `Cat ${randomString(rng, 4)}`,
      });
    }

    // --- transactions ---
    const txCount = randInt(rng, 0, 5);
    const transactions = [];
    for (let i = 0; i < txCount; i++) {
      const account = pick(rng, accounts);
      const categoryId =
        categories.length > 0 && rng() < 0.6
          ? pick(rng, categories).id
          : null;
      transactions.push({
        id: `tx-p10-${iteration}-${i}`,
        accountId: account.id,
        amount: randomAmount(rng),
        date: randomDate(rng),
        description: `Desc ${randomString(rng, 6)}`,
        categoryId,
        recurringRuleId: null,
        createdAt: randomDatetime(rng),
      });
    }

    // --- budgets ---
    const budgetCount = randInt(rng, 0, 2);
    const budgets = [];
    for (let i = 0; i < budgetCount; i++) {
      // budgets need a valid (positive finite) limit and a categoryId
      const categoryId =
        categories.length > 0
          ? pick(rng, categories).id
          : `cat-p10-fallback-${i}`;
      budgets.push({
        id: `bgt-p10-${iteration}-${i}`,
        categoryId,
        limit: Math.round(rng() * 99900 + 100) / 100, // 1.00–1000.00
        period: pick(rng, PERIODS),
        startDate: randomDate(rng),
      });
    }

    // --- recurring rules ---
    const ruleCount = randInt(rng, 0, 2);
    const recurringRules = [];
    for (let i = 0; i < ruleCount; i++) {
      const account = pick(rng, accounts);
      const categoryId =
        categories.length > 0 && rng() < 0.5
          ? pick(rng, categories).id
          : null;
      recurringRules.push({
        id: `rule-p10-${iteration}-${i}`,
        accountId: account.id,
        amount: randomAmount(rng),
        description: `Rule ${randomString(rng, 5)}`,
        categoryId,
        frequency: pick(rng, FREQUENCIES),
        startDate: randomDate(rng),
        lastExpandedDate: rng() < 0.5 ? randomDate(rng) : null,
      });
    }

    return { accounts, transactions, categories, budgets, recurringRules };
  }

  test('importFromJSON(exportToJSON(state)) returns success:true and deeply equals original state for 100 random states', () => {
    const ITERATIONS = 100;

    for (let i = 0; i < ITERATIONS; i++) {
      const rng = makePrng(i * 6271 + 31);
      const state = generateAppState(rng, i);

      const json = exportToJSON(state);
      const result = importFromJSON(json);

      // Must succeed
      expect(result.success).toBe(true);

      // Roundtripped data must deeply equal the original state
      expect(result.data).toEqual(state);
    }
  });
});

// ---------------------------------------------------------------------------
// Property 12: Referential integrity for account references
// Validates: Requirements 10.5
// ---------------------------------------------------------------------------

describe('Property 12: Referential integrity — transactions with non-existent accountId leave state unchanged', () => {
  /**
   * When CREATE_TRANSACTION or EDIT_TRANSACTION is dispatched with an
   * accountId that does not exist in state.accounts, the reducer MUST return
   * the exact same state reference (state unchanged).
   *
   * **Validates: Requirements 10.5**
   */

  // Deterministic PRNG (mulberry32) so failures are reproducible
  function makePrng(seed) {
    let s = seed >>> 0;
    return function () {
      s += 0x6d2b79f5;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function p12Pad(n) {
    return String(n).padStart(2, '0');
  }

  /** Generate a YYYY-MM-DD string within 2024 */
  function p12RandomDate(rng) {
    const month = Math.floor(rng() * 12) + 1;
    const day = Math.floor(rng() * 28) + 1;
    return `2024-${p12Pad(month)}-${p12Pad(day)}`;
  }

  /** Generate a valid transaction payload but with a guaranteed non-existent accountId */
  function p12TransactionPayload(rng, nonExistentId, overrides = {}) {
    return {
      accountId: nonExistentId,
      amount: parseFloat((rng() * 2000 - 500).toFixed(2)),
      date: p12RandomDate(rng),
      description: `tx-p12-${Math.floor(rng() * 1e6)}`,
      categoryId: null,
      ...overrides,
    };
  }

  test('CREATE_TRANSACTION with non-existent accountId on empty state returns same reference (100 iterations)', () => {
    for (let i = 0; i < 100; i++) {
      const rng = makePrng(i * 6271 + 13);

      // INITIAL_STATE has no accounts — any accountId is non-existent
      const nonExistentId = `ghost-acc-${i}-${Math.floor(rng() * 1e9)}`;
      const state = INITIAL_STATE;

      const nextState = ledgerReducer(state, {
        type: 'CREATE_TRANSACTION',
        payload: p12TransactionPayload(rng, nonExistentId),
      });

      // Must be the exact same reference — state unchanged
      expect(nextState).toBe(state);
    }
  });

  test('EDIT_TRANSACTION with non-existent accountId in a state with accounts returns same reference (100 iterations)', () => {
    const ACCOUNT_TYPES = ['checking', 'savings', 'credit', 'cash', 'investment'];

    for (let i = 0; i < 100; i++) {
      const rng = makePrng(i * 9431 + 77);

      // Build a state with 1–3 real accounts
      const accountCount = Math.floor(rng() * 3) + 1;
      const accounts = Array.from({ length: accountCount }, (_, k) => ({
        id: `acc-p12-${i}-${k}`,
        name: `Account ${k}`,
        type: ACCOUNT_TYPES[Math.floor(rng() * ACCOUNT_TYPES.length)],
        createdAt: new Date().toISOString(),
      }));

      // Add a real transaction so EDIT_TRANSACTION has something to match id-wise
      const realAccountId = accounts[0].id;
      const existingTransaction = {
        id: `txn-p12-${i}`,
        accountId: realAccountId,
        amount: 100,
        date: '2024-03-01',
        description: 'existing tx',
        categoryId: null,
        recurringRuleId: null,
        createdAt: new Date().toISOString(),
      };

      const state = {
        ...INITIAL_STATE,
        accounts,
        transactions: [existingTransaction],
      };

      // accountId that definitely does NOT exist in state.accounts
      const nonExistentId = `ghost-acc-edit-${i}-${Math.floor(rng() * 1e9)}`;

      // Provide all required fields for TransactionSchema but with bad accountId
      const payload = {
        id: existingTransaction.id,
        accountId: nonExistentId,
        amount: parseFloat((rng() * 2000 - 500).toFixed(2)),
        date: p12RandomDate(rng),
        description: `edited-p12-${i}`,
        categoryId: null,
        recurringRuleId: null,
        createdAt: existingTransaction.createdAt,
      };

      const nextState = ledgerReducer(state, {
        type: 'EDIT_TRANSACTION',
        payload,
      });

      // Must be the exact same reference — state unchanged
      expect(nextState).toBe(state);
    }
  });
});

// ---------------------------------------------------------------------------
// Property 6: Recurring rule expansion is idempotent
// Validates: Requirements 5.3
// ---------------------------------------------------------------------------

describe('Property 6: Recurring rule expansion is idempotent', () => {
  /**
   * Calling expandRule twice with the same referenceDate produces no additional
   * transactions on the second call, because the updatedRule returned by the
   * first call carries an updated lastExpandedDate that marks the period as
   * already covered.
   *
   * **Validates: Requirements 5.3**
   */

  const FREQUENCIES = ['daily', 'weekly', 'biweekly', 'monthly', 'yearly'];

  function p6Pad(n) {
    return String(n).padStart(2, '0');
  }

  /**
   * Simple counter-based id generator.  Each call returns a unique string so
   * that duplicate detection never fires due to identical ids.
   */
  function makeIdGen() {
    let counter = 0;
    return () => `gen-id-${++counter}`;
  }

  /**
   * Return a YYYY-MM-DD string for a random day in 2023–2024.
   * offsetDays is in [0, 730) covering roughly two years.
   */
  function randomStartDate(rng) {
    const base = new Date('2023-01-01T00:00:00Z');
    const offsetDays = Math.floor(rng() * 730);
    const d = new Date(base.getTime() + offsetDays * 86400000);
    return `${d.getUTCFullYear()}-${p6Pad(d.getUTCMonth() + 1)}-${p6Pad(d.getUTCDate())}`;
  }

  /**
   * Return a YYYY-MM-DD string for a random day in 2024 (366 days).
   */
  function randomRefDate(rng) {
    const base = new Date('2024-01-01T00:00:00Z');
    const offsetDays = Math.floor(rng() * 366);
    const d = new Date(base.getTime() + offsetDays * 86400000);
    return `${d.getUTCFullYear()}-${p6Pad(d.getUTCMonth() + 1)}-${p6Pad(d.getUTCDate())}`;
  }

  /**
   * Deterministic pseudo-random number generator (mulberry32).
   */
  function makePrng(seed) {
    let s = seed >>> 0;
    return function () {
      s += 0x6d2b79f5;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  test('second expandRule call with same referenceDate produces 0 transactions across 100 random rules', () => {
    const ITERATIONS = 100;

    for (let i = 0; i < ITERATIONS; i++) {
      const rng = makePrng(i * 6271 + 13);

      // Random frequency
      const frequency = FREQUENCIES[Math.floor(rng() * FREQUENCIES.length)];

      // Random start date in 2023–2024
      const startDate = randomStartDate(rng);

      // Random reference date in 2024
      const refDate = randomRefDate(rng);

      const rule = {
        id: `rule-p6-${i}`,
        accountId: 'acc-p6',
        amount: parseFloat((rng() * 200 - 50).toFixed(2)),
        description: `Recurring ${frequency}`,
        frequency,
        startDate,
        lastExpandedDate: null,
        categoryId: null,
      };

      // Use a shared id generator so ids are always unique across both calls
      const idGen = makeIdGen();

      // First expansion
      const { updatedRule } = expandRule(rule, refDate, idGen);

      // Second expansion using the updatedRule from the first call
      const { transactions: second } = expandRule(updatedRule, refDate, idGen);

      expect(second.length).toBe(0);
    }
  });
});

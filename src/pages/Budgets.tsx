import { useState } from 'react';
import { useLedger } from '../hooks/useLedger.jsx';
import { useBudgets } from '../hooks/useBudgets.js';
import BudgetBar from '../components/BudgetBar.jsx';
import { BudgetForm } from '../components/BudgetForm.jsx';
import { RecurringRuleForm } from '../components/RecurringRuleForm.jsx';
import { generateId } from '../lib/id.js';
import type { BudgetFormPayload } from '../components/BudgetForm.jsx';
import type { RecurringRuleFormPayload } from '../components/RecurringRuleForm.jsx';
import type { Budget, Category, RecurringRule } from '../lib/types.js';
import type { BudgetProgress } from '../hooks/useBudgets.js';

import stylesMod from './Budgets.module.css';

const styles: { [key: string]: string } = stylesMod as unknown as { [key: string]: string };

/**
 * Budgets page — budget management, category management, recurring rule management.
 *
 * Lazy-loaded by the App shell via React.lazy, so must be the default export.
 *
 * Requirements: 3.1, 4.1, 4.2, 4.3, 5.1, 5.4, 5.5
 */
export default function Budgets(): React.JSX.Element {
  const { state, dispatch } = useLedger();
  const budgetProgress = useBudgets(state);

  // ── Budget section state ──────────────────────────────────────────────────
  const [showBudgetForm, setShowBudgetForm] = useState<boolean>(false);
  const [editingBudget, setEditingBudget] = useState<BudgetProgress | null>(null);

  // ── Category section state ────────────────────────────────────────────────
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [categoryError, setCategoryError] = useState<string>('');

  // ── Recurring rules section state ─────────────────────────────────────────
  const [showRuleForm, setShowRuleForm] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null);

  // ── Budget handlers ───────────────────────────────────────────────────────

  function handleCreateBudget(payload: BudgetFormPayload) {
    dispatch({
      type: 'CREATE_BUDGET',
      payload: { ...payload, id: generateId() },
    });
    setShowBudgetForm(false);
  }

  function handleEditBudget(payload: BudgetFormPayload) {
    dispatch({
      type: 'EDIT_BUDGET',
      payload: { ...payload, id: editingBudget!.id },
    });
    setEditingBudget(null);
  }

  function handleDeleteBudget(id: string) {
    dispatch({ type: 'DELETE_BUDGET', payload: { id } });
  }

  function startEditBudget(budget: BudgetProgress) {
    setEditingBudget(budget);
    setShowBudgetForm(false);
  }

  function cancelBudgetForm() {
    setShowBudgetForm(false);
    setEditingBudget(null);
  }

  // ── Category handlers ─────────────────────────────────────────────────────

  function handleAddCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) {
      setCategoryError('Category name is required.');
      return;
    }
    if (state.categories.some((c: Category) => c.name.toLowerCase() === name.toLowerCase())) {
      setCategoryError('A category with this name already exists.');
      return;
    }
    dispatch({
      type: 'CREATE_CATEGORY',
      payload: { id: generateId(), name },
    });
    setNewCategoryName('');
    setCategoryError('');
  }

  function handleDeleteCategory(id: string) {
    dispatch({ type: 'DELETE_CATEGORY', payload: { id } });
  }

  // ── Recurring rule handlers ───────────────────────────────────────────────

  function handleCreateRule(payload: RecurringRuleFormPayload) {
    dispatch({
      type: 'CREATE_RECURRING_RULE',
      payload: { ...payload, id: generateId(), lastExpandedDate: null },
    });
    setShowRuleForm(false);
  }

  function handleEditRule(payload: RecurringRuleFormPayload) {
    dispatch({
      type: 'EDIT_RECURRING_RULE',
      payload: { ...payload, id: editingRule!.id },
    });
    setEditingRule(null);
  }

  function handleDeleteRule(id: string) {
    dispatch({ type: 'DELETE_RECURRING_RULE', payload: { id } });
  }

  function startEditRule(rule: RecurringRule) {
    setEditingRule(rule);
    setShowRuleForm(false);
  }

  function cancelRuleForm() {
    setShowRuleForm(false);
    setEditingRule(null);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function getCategoryName(categoryId: string): string {
    return state.categories.find((c: Category) => c.id === categoryId)?.name ?? categoryId;
  }

  function getAccountName(accountId: string): string {
    return state.accounts.find((a: { id: string; name: string }) => a.id === accountId)?.name ?? accountId;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className={styles['page']} aria-label="Budgets">

      {/* ── Budgets section ─────────────────────────────────────────────── */}
      <section className={styles['section']} aria-labelledby="budgets-heading">
        <div className={styles['sectionHeader']}>
          <h2 id="budgets-heading" className={styles['sectionHeading']}>Budgets</h2>
          {!showBudgetForm && !editingBudget && (
            <button
              className={styles['addButton']}
              onClick={() => setShowBudgetForm(true)}
            >
              + Add Budget
            </button>
          )}
        </div>

        {/* Create budget form */}
        {showBudgetForm && (
          <div className={styles['formCard']}>
            <BudgetForm
              categories={state.categories}
              onSubmit={handleCreateBudget}
              onCancel={cancelBudgetForm}
            />
          </div>
        )}

        {/* Budget list */}
        {budgetProgress.length === 0 && !showBudgetForm ? (
          <p className={styles['emptyState']}>No budgets yet. Add one to track your spending.</p>
        ) : (
          <div className={styles['budgetGrid']}>
            {budgetProgress.map((budget: BudgetProgress) => {
              const isEditing = editingBudget?.id === budget.id;
              return (
                <div key={budget.id} className={styles['budgetItem']}>
                  {isEditing ? (
                    <div className={styles['formCard']}>
                      <BudgetForm
                        categories={state.categories}
                        initialValues={budget}
                        onSubmit={handleEditBudget}
                        onCancel={cancelBudgetForm}
                      />
                    </div>
                  ) : (
                    <>
                      <BudgetBar
                        budget={budget}
                        spent={budget.spent}
                        ratio={budget.ratio}
                        overspent={budget.overspent}
                        categoryName={getCategoryName(budget.categoryId)}
                      />
                      <div className={styles['itemActions']}>
                        <button
                          className={styles['editButton']}
                          onClick={() => startEditBudget(budget)}
                          aria-label={`Edit budget for ${getCategoryName(budget.categoryId)}`}
                        >
                          Edit
                        </button>
                        <button
                          className={styles['deleteButton']}
                          onClick={() => handleDeleteBudget(budget.id)}
                          aria-label={`Delete budget for ${getCategoryName(budget.categoryId)}`}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Categories section ───────────────────────────────────────────── */}
      <section className={styles['section']} aria-labelledby="categories-heading">
        <h2 id="categories-heading" className={styles['sectionHeading']}>Categories</h2>

        {/* Add category form */}
        <form
          className={styles['inlineForm']}
          onSubmit={handleAddCategory}
          aria-label="Add category"
        >
          <label htmlFor="new-category-name" className={styles['srOnly']}>
            New category name
          </label>
          <input
            id="new-category-name"
            type="text"
            className={styles['textInput']}
            value={newCategoryName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setNewCategoryName(e.target.value);
              if (categoryError) setCategoryError('');
            }}
            placeholder="New category name"
            aria-describedby={categoryError ? 'category-error' : undefined}
            aria-invalid={Boolean(categoryError)}
          />
          <button type="submit" className={styles['addButton']}>Add</button>
        </form>
        {categoryError && (
          <span id="category-error" role="alert" className={styles['fieldError']}>
            {categoryError}
          </span>
        )}

        {/* Category list */}
        {state.categories.length === 0 ? (
          <p className={styles['emptyState']}>No categories yet.</p>
        ) : (
          <ul className={styles['itemList']} aria-label="Category list">
            {state.categories.map((cat: Category) => (
              <li key={cat.id} className={styles['listItem']}>
                <span className={styles['itemName']}>{cat.name}</span>
                <button
                  className={styles['deleteButton']}
                  onClick={() => handleDeleteCategory(cat.id)}
                  aria-label={`Delete category ${cat.name}`}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Recurring Rules section ──────────────────────────────────────── */}
      <section className={styles['section']} aria-labelledby="rules-heading">
        <div className={styles['sectionHeader']}>
          <h2 id="rules-heading" className={styles['sectionHeading']}>Recurring Rules</h2>
          {!showRuleForm && !editingRule && (
            <button
              className={styles['addButton']}
              onClick={() => setShowRuleForm(true)}
            >
              + Add Rule
            </button>
          )}
        </div>

        {/* Create rule form */}
        {showRuleForm && (
          <div className={styles['formCard']}>
            <RecurringRuleForm
              accounts={state.accounts}
              categories={state.categories}
              onSubmit={handleCreateRule}
              onCancel={cancelRuleForm}
            />
          </div>
        )}

        {/* Rules list */}
        {state.recurringRules.length === 0 && !showRuleForm ? (
          <p className={styles['emptyState']}>No recurring rules yet. Add one to automate transactions.</p>
        ) : (
          <ul className={styles['itemList']} aria-label="Recurring rules list">
            {state.recurringRules.map((rule: RecurringRule) => {
              const isEditing = editingRule?.id === rule.id;
              return (
                <li key={rule.id} className={styles['listItem']}>
                  {isEditing ? (
                    <div className={styles['formCard']}>
                      <RecurringRuleForm
                        accounts={state.accounts}
                        categories={state.categories}
                        initialValues={rule}
                        onSubmit={handleEditRule}
                        onCancel={cancelRuleForm}
                      />
                    </div>
                  ) : (
                    <>
                      <div className={styles['ruleInfo']}>
                        <span className={styles['itemName']}>{rule.description}</span>
                        <span className={styles['ruleMeta']}>
                          {rule.frequency} · {getAccountName(rule.accountId)}
                          {rule.categoryId ? ` · ${getCategoryName(rule.categoryId)}` : ''}
                          {' · '}
                          <span className={rule.amount < 0 ? styles['amountNegative'] : styles['amountPositive']}>
                            {rule.amount < 0 ? '-' : '+'}${Math.abs(rule.amount).toFixed(2)}
                          </span>
                        </span>
                      </div>
                      <div className={styles['itemActions']}>
                        <button
                          className={styles['editButton']}
                          onClick={() => startEditRule(rule)}
                          aria-label={`Edit rule ${rule.description}`}
                        >
                          Edit
                        </button>
                        <button
                          className={styles['deleteButton']}
                          onClick={() => handleDeleteRule(rule.id)}
                          aria-label={`Delete rule ${rule.description}`}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
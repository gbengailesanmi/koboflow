import type { Budget, CategoryBudget, BudgetPeriod } from '@money-mapper/shared';
/**
 * Get or create budget for a customer
 */
export declare function getBudget(customerId: string): Promise<Budget | null>;
/**
 * Create or update budget for a customer
 */
export declare function upsertBudget(customerId: string, totalBudgetLimit: number, categories: CategoryBudget[], period?: BudgetPeriod): Promise<void>;
/**
 * Update monthly budget
 */
export declare function updateMonthlyBudget(customerId: string, totalBudgetLimit: number, period?: BudgetPeriod): Promise<void>;
/**
 * Update category budgets
 */
export declare function updateCategoryBudgets(customerId: string, categories: CategoryBudget[]): Promise<void>;
/**
 * Update budget period
 */
export declare function updateBudgetPeriod(customerId: string, period: BudgetPeriod): Promise<void>;
/**
 * Update budget with period (convenience function)
 */
export declare function updateBudgetWithPeriod(customerId: string, totalBudgetLimit: number, categories: CategoryBudget[], period?: BudgetPeriod): Promise<void>;
//# sourceMappingURL=budget-helpers.d.ts.map
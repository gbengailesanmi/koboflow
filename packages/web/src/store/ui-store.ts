/**
 * UI STATE STORE
 * 
 * This store manages ONLY UI state, not data from the API.
 * API data is fetched via api-service.ts and cached by Next.js.
 * 
 * UI State includes:
 * - Selected items (account, transaction, category)
 * - UI toggles (modals, sidebars, dropdowns)
 * - View preferences (grid/list, sort order)
 * - Filters (date range, categories)
 * - Temporary UI data (toasts, loading indicators)
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'

// ============================================================================
// TYPES
// ============================================================================

type ModalType = 
  | 'add-account' 
  | 'edit-account' 
  | 'delete-account'
  | 'add-transaction' 
  | 'edit-transaction' 
  | 'delete-transaction'
  | 'edit-budget' 
  | 'settings'
  | null

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface DateRange {
  start: Date | null
  end: Date | null
}

interface UIState {
  // ===== SELECTED ITEMS =====
  selectedAccountId: string | null
  selectedTransactionId: string | null
  selectedCategoryId: string | null
  
  // ===== UI TOGGLES =====
  isSidebarOpen: boolean
  isMobileMenuOpen: boolean
  isModalOpen: boolean
  modalType: ModalType
  modalData: any // Additional data passed to modal
  
  // ===== VIEW PREFERENCES =====
  dashboardView: 'grid' | 'list'
  transactionsSortBy: 'date' | 'amount' | 'category' | 'description'
  transactionsSortOrder: 'asc' | 'desc'
  accountsView: 'carousel' | 'row' | 'grid'
  
  // ===== FILTERS =====
  dateRange: DateRange
  categoryFilter: string[]
  accountFilter: string[]
  amountRangeFilter: { min: number | null; max: number | null }
  searchQuery: string
  
  // ===== TEMPORARY UI DATA =====
  toasts: Toast[]
  
  // ===== ACTIONS: SELECTED ITEMS =====
  setSelectedAccount: (id: string | null) => void
  setSelectedTransaction: (id: string | null) => void
  setSelectedCategory: (id: string | null) => void
  clearSelections: () => void
  
  // ===== ACTIONS: UI TOGGLES =====
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleMobileMenu: () => void
  openModal: (type: Exclude<ModalType, null>, data?: any) => void
  closeModal: () => void
  
  // ===== ACTIONS: VIEW PREFERENCES =====
  setDashboardView: (view: 'grid' | 'list') => void
  setTransactionsSort: (by: UIState['transactionsSortBy'], order: 'asc' | 'desc') => void
  setAccountsView: (view: 'carousel' | 'row' | 'grid') => void
  
  // ===== ACTIONS: FILTERS =====
  setDateRange: (start: Date | null, end: Date | null) => void
  addCategoryFilter: (category: string) => void
  removeCategoryFilter: (category: string) => void
  setCategoryFilter: (categories: string[]) => void
  addAccountFilter: (accountId: string) => void
  removeAccountFilter: (accountId: string) => void
  setAmountRangeFilter: (min: number | null, max: number | null) => void
  setSearchQuery: (query: string) => void
  clearFilters: () => void
  
  // ===== ACTIONS: TOASTS =====
  showToast: (message: string, type?: ToastType) => void
  clearToast: (id: string) => void
  clearAllToasts: () => void
  
  // ===== ACTIONS: RESET =====
  reset: () => void
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState = {
  // Selected items
  selectedAccountId: null,
  selectedTransactionId: null,
  selectedCategoryId: null,
  
  // UI toggles
  isSidebarOpen: true,
  isMobileMenuOpen: false,
  isModalOpen: false,
  modalType: null,
  modalData: null,
  
  // View preferences
  dashboardView: 'grid' as const,
  transactionsSortBy: 'date' as const,
  transactionsSortOrder: 'desc' as const,
  accountsView: 'carousel' as const,
  
  // Filters
  dateRange: { start: null, end: null },
  categoryFilter: [],
  accountFilter: [],
  amountRangeFilter: { min: null, max: null },
  searchQuery: '',
  
  // Temporary UI data
  toasts: [],
}

// ============================================================================
// STORE
// ============================================================================

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      ...initialState,
      
      // ===== SELECTED ITEMS =====
      setSelectedAccount: (id) => set({ selectedAccountId: id }),
      
      setSelectedTransaction: (id) => set({ selectedTransactionId: id }),
      
      setSelectedCategory: (id) => set({ selectedCategoryId: id }),
      
      clearSelections: () => set({
        selectedAccountId: null,
        selectedTransactionId: null,
        selectedCategoryId: null,
      }),
      
      // ===== UI TOGGLES =====
      toggleSidebar: () => set((state) => ({ 
        isSidebarOpen: !state.isSidebarOpen 
      })),
      
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      
      toggleMobileMenu: () => set((state) => ({ 
        isMobileMenuOpen: !state.isMobileMenuOpen 
      })),
      
      openModal: (type, data = null) => set({ 
        isModalOpen: true, 
        modalType: type,
        modalData: data,
      }),
      
      closeModal: () => set({ 
        isModalOpen: false, 
        modalType: null,
        modalData: null,
      }),
      
      // ===== VIEW PREFERENCES =====
      setDashboardView: (view) => set({ dashboardView: view }),
      
      setTransactionsSort: (by, order) => set({
        transactionsSortBy: by,
        transactionsSortOrder: order,
      }),
      
      setAccountsView: (view) => set({ accountsView: view }),
      
      // ===== FILTERS =====
      setDateRange: (start, end) => set({ 
        dateRange: { start, end } 
      }),
      
      addCategoryFilter: (category) => set((state) => ({
        categoryFilter: [...state.categoryFilter, category],
      })),
      
      removeCategoryFilter: (category) => set((state) => ({
        categoryFilter: state.categoryFilter.filter((c) => c !== category),
      })),
      
      setCategoryFilter: (categories) => set({ categoryFilter: categories }),
      
      addAccountFilter: (accountId) => set((state) => ({
        accountFilter: [...state.accountFilter, accountId],
      })),
      
      removeAccountFilter: (accountId) => set((state) => ({
        accountFilter: state.accountFilter.filter((id) => id !== accountId),
      })),
      
      setAmountRangeFilter: (min, max) => set({
        amountRangeFilter: { min, max },
      }),
      
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      clearFilters: () => set({
        dateRange: { start: null, end: null },
        categoryFilter: [],
        accountFilter: [],
        amountRangeFilter: { min: null, max: null },
        searchQuery: '',
      }),
      
      // ===== TOASTS =====
      showToast: (message, type = 'info') => set((state) => ({
        toasts: [
          ...state.toasts,
          {
            id: `toast-${Date.now()}-${Math.random()}`,
            message,
            type,
          },
        ],
      })),
      
      clearToast: (id) => set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      })),
      
      clearAllToasts: () => set({ toasts: [] }),
      
      // ===== RESET =====
      reset: () => set(initialState),
    }),
    {
      name: 'UI Store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
)

// ============================================================================
// SELECTOR HOOKS (For better performance)
// ============================================================================

/**
 * Hook for selected items
 * Uses useShallow to prevent infinite re-renders
 */
export const useSelectedItems = () => useUIStore(
  useShallow((state) => ({
    selectedAccountId: state.selectedAccountId,
    selectedTransactionId: state.selectedTransactionId,
    selectedCategoryId: state.selectedCategoryId,
    setSelectedAccount: state.setSelectedAccount,
    setSelectedTransaction: state.setSelectedTransaction,
    setSelectedCategory: state.setSelectedCategory,
    clearSelections: state.clearSelections,
  }))
)

/**
 * Hook for modal state
 * Uses useShallow to prevent infinite re-renders
 */
export const useModal = () => useUIStore(
  useShallow((state) => ({
    isOpen: state.isModalOpen,
    type: state.modalType,
    data: state.modalData,
    openModal: state.openModal,
    closeModal: state.closeModal,
  }))
)

/**
 * Hook for filters
 * Uses useShallow to prevent infinite re-renders
 */
export const useFilters = () => useUIStore(
  useShallow((state) => ({
    dateRange: state.dateRange,
    categoryFilter: state.categoryFilter,
    accountFilter: state.accountFilter,
    amountRangeFilter: state.amountRangeFilter,
    searchQuery: state.searchQuery,
    setDateRange: state.setDateRange,
    addCategoryFilter: state.addCategoryFilter,
    removeCategoryFilter: state.removeCategoryFilter,
    setCategoryFilter: state.setCategoryFilter,
    addAccountFilter: state.addAccountFilter,
    removeAccountFilter: state.removeAccountFilter,
    setAmountRangeFilter: state.setAmountRangeFilter,
    setSearchQuery: state.setSearchQuery,
    clearFilters: state.clearFilters,
  }))
)

/**
 * Hook for toasts
 * Uses useShallow to prevent infinite re-renders
 */
export const useToasts = () => useUIStore(
  useShallow((state) => ({
    toasts: state.toasts,
    showToast: state.showToast,
    clearToast: state.clearToast,
    clearAllToasts: state.clearAllToasts,
  }))
)

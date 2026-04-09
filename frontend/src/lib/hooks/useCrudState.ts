/**
 * Custom hook for managing CRUD operations state
 * Consolidates: showCreate, editingId, isLoading, error, expandedId
 * Reduces ~5 useState calls into 1
 */

import { useState, useCallback } from 'react';

export interface CrudState {
  showCreate: boolean;
  editingId: string | null;
  isLoading: boolean;
  error: string;
  expandedId: string | null;
}

const initialCrudState: CrudState = {
  showCreate: false,
  editingId: null,
  isLoading: false,
  error: '',
  expandedId: null,
};

export function useCrudState(initial: Partial<CrudState> = {}) {
  const [state, setState] = useState<CrudState>({
    ...initialCrudState,
    ...initial,
  });

  const setShowCreate = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, showCreate: value }));
  }, []);

  const setEditingId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, editingId: id }));
  }, []);

  const setIsLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: string) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const setExpandedId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, expandedId: id }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: '' }));
  }, []);

  const reset = useCallback(() => {
    setState(initialCrudState);
  }, []);

  return {
    state,
    setShowCreate,
    setEditingId,
    setIsLoading,
    setError,
    setExpandedId,
    clearError,
    reset,
  };
}

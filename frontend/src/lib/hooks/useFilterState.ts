/**
 * Custom hook for managing filter/search state
 * Consolidates: searchTerm, roleFilter, sortBy, pagination
 * Reduces ~4 useState calls into 1
 */

import { useState, useCallback } from 'react';

export interface FilterState {
  searchTerm: string;
  roleFilter: string;
  sortBy: string;
  page: number;
  perPage: number;
}

const initialFilterState: FilterState = {
  searchTerm: '',
  roleFilter: '',
  sortBy: 'name_ar',
  page: 1,
  perPage: 10,
};

export function useFilterState(initial: Partial<FilterState> = {}) {
  const [state, setState] = useState<FilterState>({
    ...initialFilterState,
    ...initial,
  });

  const setSearchTerm = useCallback((term: string) => {
    setState((prev) => ({ ...prev, searchTerm: term, page: 1 }));
  }, []);

  const setRoleFilter = useCallback((role: string) => {
    setState((prev) => ({ ...prev, roleFilter: role, page: 1 }));
  }, []);

  const setSortBy = useCallback((sort: string) => {
    setState((prev) => ({ ...prev, sortBy: sort, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setState((prev) => ({ ...prev, page }));
  }, []);

  const setPerPage = useCallback((perPage: number) => {
    setState((prev) => ({ ...prev, perPage, page: 1 }));
  }, []);

  const reset = useCallback(() => {
    setState(initialFilterState);
  }, []);

  return {
    state,
    setSearchTerm,
    setRoleFilter,
    setSortBy,
    setPage,
    setPerPage,
    reset,
  };
}

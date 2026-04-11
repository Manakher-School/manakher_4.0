import { useState, useCallback } from "react";

export interface PaginationState {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

/**
 * Custom hook for managing pagination state
 * Tracks current page, items per page, and total count
 * Automatically calculates total pages
 */
export function usePagination(initialPerPage: number = 10) {
  const [state, setState] = useState<PaginationState>({
    page: 1,
    perPage: initialPerPage,
    total: 0,
    totalPages: 0,
  });

  const setPage = useCallback((page: number) => {
    setState((prev) => {
      const newPage = Math.max(1, Math.min(page, prev.totalPages));
      return { ...prev, page: newPage };
    });
  }, []);

  const setPerPage = useCallback((perPage: number) => {
    setState((prev) => ({
      ...prev,
      perPage: Math.max(1, perPage),
      page: 1, // Reset to first page when changing page size
      totalPages: Math.ceil(prev.total / Math.max(1, perPage)),
    }));
  }, []);

  const setTotal = useCallback((total: number) => {
    setState((prev) => ({
      ...prev,
      total,
      totalPages: Math.ceil(total / prev.perPage),
    }));
  }, []);

  const goToFirstPage = useCallback(() => {
    setPage(1);
  }, [setPage]);

  const goToLastPage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      page: prev.totalPages,
    }));
  }, []);

  const nextPage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      page: Math.min(prev.page + 1, prev.totalPages),
    }));
  }, []);

  const previousPage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      page: Math.max(1, prev.page - 1),
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      page: 1,
      perPage: initialPerPage,
      total: 0,
      totalPages: 0,
    });
  }, [initialPerPage]);

  return {
    state,
    setPage,
    setPerPage,
    setTotal,
    goToFirstPage,
    goToLastPage,
    nextPage,
    previousPage,
    reset,
  };
}

/**
 * Custom hook for managing form state
 * Consolidates: form data, field errors, touched fields
 * Reduces ~15+ useState calls into 1
 */

import { useState, useCallback } from 'react';

export interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
}

export function useFormState<T extends Record<string, any>>(initialData: T) {
  const [state, setState] = useState<FormState<T>>({
    data: initialData,
    errors: {},
    touched: {},
  });

  const setFieldValue = useCallback(
    (field: keyof T, value: any) => {
      setState((prev) => ({
        ...prev,
        data: { ...prev.data, [field]: value },
      }));
    },
    []
  );

  const setFieldError = useCallback(
    (field: keyof T, error: string) => {
      setState((prev) => ({
        ...prev,
        errors: { ...prev.errors, [field]: error },
      }));
    },
    []
  );

  const setFieldTouched = useCallback(
    (field: keyof T, touched: boolean = true) => {
      setState((prev) => ({
        ...prev,
        touched: { ...prev.touched, [field]: touched },
      }));
    },
    []
  );

  const setData = useCallback((data: Partial<T>) => {
    setState((prev) => ({
      ...prev,
      data: { ...prev.data, ...data },
    }));
  }, []);

  const setErrors = useCallback((errors: Partial<Record<keyof T, string>>) => {
    setState((prev) => ({
      ...prev,
      errors,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      errors: {},
      touched: {},
    });
  }, [initialData]);

  const clearErrors = useCallback(() => {
    setState((prev) => ({
      ...prev,
      errors: {},
    }));
  }, []);

  const clearTouched = useCallback(() => {
    setState((prev) => ({
      ...prev,
      touched: {},
    }));
  }, []);

  // Alias for setFieldTouched for backward compatibility
  const setTouched = setFieldTouched;

  return {
    state,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    setTouched,
    setData,
    setErrors,
    reset,
    clearErrors,
    clearTouched,
  };
}

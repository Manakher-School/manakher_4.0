import { renderHook, act } from '@testing-library/react';
import { useCrudState } from '@/lib/hooks/useCrudState';

describe('useCrudState', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useCrudState());
    
    expect(result.current.state).toEqual({
      showCreate: false,
      editingId: null,
      isLoading: false,
      error: '',
      expandedId: null,
    });
  });

  it('should set loading state to true', () => {
    const { result } = renderHook(() => useCrudState());
    
    act(() => {
      result.current.setIsLoading(true);
    });
    
    expect(result.current.state.isLoading).toBe(true);
  });

  it('should set loading state to false', () => {
    const { result } = renderHook(() => useCrudState());
    
    act(() => {
      result.current.setIsLoading(true);
    });
    
    act(() => {
      result.current.setIsLoading(false);
    });
    
    expect(result.current.state.isLoading).toBe(false);
  });

  it('should set error message', () => {
    const { result } = renderHook(() => useCrudState());
    const errorMsg = 'An error occurred';
    
    act(() => {
      result.current.setError(errorMsg);
    });
    
    expect(result.current.state.error).toBe(errorMsg);
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useCrudState());
    
    act(() => {
      result.current.setError('Test error');
    });
    
    expect(result.current.state.error).toBe('Test error');
    
    act(() => {
      result.current.clearError();
    });
    
    expect(result.current.state.error).toBe('');
  });

  it('should set expanded ID', () => {
    const { result } = renderHook(() => useCrudState());
    const id = 'test-id-123';
    
    act(() => {
      result.current.setExpandedId(id);
    });
    
    expect(result.current.state.expandedId).toBe(id);
  });

  it('should clear expanded ID by setting to null', () => {
    const { result } = renderHook(() => useCrudState());
    
    act(() => {
      result.current.setExpandedId('test-id');
    });
    
    expect(result.current.state.expandedId).toBe('test-id');
    
    act(() => {
      result.current.setExpandedId(null);
    });
    
    expect(result.current.state.expandedId).toBe(null);
  });

  it('should set show create state', () => {
    const { result } = renderHook(() => useCrudState());
    
    act(() => {
      result.current.setShowCreate(true);
    });
    
    expect(result.current.state.showCreate).toBe(true);
    
    act(() => {
      result.current.setShowCreate(false);
    });
    
    expect(result.current.state.showCreate).toBe(false);
  });

  it('should set editing ID', () => {
    const { result } = renderHook(() => useCrudState());
    
    act(() => {
      result.current.setEditingId('edit-id-456');
    });
    
    expect(result.current.state.editingId).toBe('edit-id-456');
  });

  it('should reset to initial state', () => {
    const { result } = renderHook(() => useCrudState());
    
    // Set multiple states
    act(() => {
      result.current.setShowCreate(true);
      result.current.setEditingId('test-id');
      result.current.setIsLoading(true);
      result.current.setError('Test error');
    });
    
    // Verify they're set
    expect(result.current.state.showCreate).toBe(true);
    expect(result.current.state.editingId).toBe('test-id');
    expect(result.current.state.isLoading).toBe(true);
    expect(result.current.state.error).toBe('Test error');
    
    // Reset
    act(() => {
      result.current.reset();
    });
    
    // Verify reset to defaults
    expect(result.current.state.showCreate).toBe(false);
    expect(result.current.state.editingId).toBe(null);
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.error).toBe('');
    expect(result.current.state.expandedId).toBe(null);
  });

  it('should toggle expanded ID', () => {
    const { result } = renderHook(() => useCrudState());
    const id = 'toggle-id';
    
    // Expand
    act(() => {
      result.current.setExpandedId(id);
    });
    expect(result.current.state.expandedId).toBe(id);
    
    // Collapse
    act(() => {
      result.current.setExpandedId(null);
    });
    expect(result.current.state.expandedId).toBe(null);
    
    // Expand again
    act(() => {
      result.current.setExpandedId(id);
    });
    expect(result.current.state.expandedId).toBe(id);
  });
});

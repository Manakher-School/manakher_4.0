import { renderHook, act } from '@testing-library/react'
import { useCrudState } from '../useCrudState'

describe('useCrudState', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useCrudState())

    expect(result.current.state.isLoading).toBe(false)
    expect(result.current.state.showCreate).toBe(false)
    expect(result.current.state.editingId).toBe(null)
    expect(result.current.state.expandedId).toBe(null)
  })

  it('should toggle loading state', () => {
    const { result } = renderHook(() => useCrudState())

    act(() => {
      result.current.setIsLoading(true)
    })

    expect(result.current.state.isLoading).toBe(true)

    act(() => {
      result.current.setIsLoading(false)
    })

    expect(result.current.state.isLoading).toBe(false)
  })

  it('should toggle show create form', () => {
    const { result } = renderHook(() => useCrudState())

    act(() => {
      result.current.setShowCreate(true)
    })

    expect(result.current.state.showCreate).toBe(true)

    act(() => {
      result.current.setShowCreate(false)
    })

    expect(result.current.state.showCreate).toBe(false)
  })

  it('should set and clear editing id', () => {
    const { result } = renderHook(() => useCrudState())

    act(() => {
      result.current.setEditingId('123')
    })

    expect(result.current.state.editingId).toBe('123')

    act(() => {
      result.current.setEditingId(null)
    })

    expect(result.current.state.editingId).toBe(null)
  })

  it('should set and clear expanded id', () => {
    const { result } = renderHook(() => useCrudState())

    act(() => {
      result.current.setExpandedId('456')
    })

    expect(result.current.state.expandedId).toBe('456')

    act(() => {
      result.current.setExpandedId(null)
    })

    expect(result.current.state.expandedId).toBe(null)
  })

  it('should reset all state', () => {
    const { result } = renderHook(() => useCrudState())

    act(() => {
      result.current.setIsLoading(true)
      result.current.setShowCreate(true)
      result.current.setEditingId('123')
      result.current.setExpandedId('456')
    })

    expect(result.current.state.isLoading).toBe(true)
    expect(result.current.state.showCreate).toBe(true)
    expect(result.current.state.editingId).toBe('123')
    expect(result.current.state.expandedId).toBe('456')

    act(() => {
      result.current.reset()
    })

    expect(result.current.state.isLoading).toBe(false)
    expect(result.current.state.showCreate).toBe(false)
    expect(result.current.state.editingId).toBe(null)
    expect(result.current.state.expandedId).toBe(null)
  })
})

import { renderHook, act } from '@testing-library/react'
import { useFilterState } from '../useFilterState'

describe('useFilterState', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() =>
      useFilterState({
        searchTerm: '',
        page: 1,
        perPage: 10,
      })
    )

    expect(result.current.state.searchTerm).toBe('')
    expect(result.current.state.page).toBe(1)
    expect(result.current.state.perPage).toBe(10)
  })

  it('should update search term', () => {
    const { result } = renderHook(() =>
      useFilterState({
        searchTerm: '',
        page: 1,
        perPage: 10,
      })
    )

    act(() => {
      result.current.setSearchTerm('test query')
    })

    expect(result.current.state.searchTerm).toBe('test query')
  })

  it('should change page', () => {
    const { result } = renderHook(() =>
      useFilterState({
        searchTerm: '',
        page: 1,
        perPage: 10,
      })
    )

    act(() => {
      result.current.setPage(2)
    })

    expect(result.current.state.page).toBe(2)

    act(() => {
      result.current.setPage(5)
    })

    expect(result.current.state.page).toBe(5)
  })

  it('should update per page', () => {
    const { result } = renderHook(() =>
      useFilterState({
        searchTerm: '',
        page: 1,
        perPage: 10,
      })
    )

    act(() => {
      result.current.setPerPage(25)
    })

    expect(result.current.state.perPage).toBe(25)
  })

  it('should reset to initial state', () => {
    const { result } = renderHook(() =>
      useFilterState({
        searchTerm: '',
        page: 1,
        perPage: 10,
      })
    )

    act(() => {
      result.current.setSearchTerm('changed')
      result.current.setPage(3)
      result.current.setPerPage(50)
    })

    expect(result.current.state.searchTerm).toBe('changed')
    expect(result.current.state.page).toBe(3)
    expect(result.current.state.perPage).toBe(50)

    act(() => {
      result.current.reset()
    })

    expect(result.current.state.searchTerm).toBe('')
    expect(result.current.state.page).toBe(1)
    expect(result.current.state.perPage).toBe(10)
  })

  it('should reset page to 1 when search changes', () => {
    const { result } = renderHook(() =>
      useFilterState({
        searchTerm: '',
        page: 1,
        perPage: 10,
      })
    )

    act(() => {
      result.current.setPage(5)
      result.current.setSearchTerm('new search')
    })

    // Should reset page to 1 when searching
    expect(result.current.state.page).toBe(1)
    expect(result.current.state.searchTerm).toBe('new search')
  })
})

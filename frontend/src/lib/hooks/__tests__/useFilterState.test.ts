import { renderHook, act } from '@testing-library/react'
import { useFilterState } from '../useFilterState'

describe('useFilterState', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useFilterState())

    expect(result.current.state.searchTerm).toBe('')
    expect(result.current.state.page).toBe(1)
    expect(result.current.state.perPage).toBe(10)
    expect(result.current.state.roleFilter).toBe('')
    expect(result.current.state.sortBy).toBe('name_ar')
  })

  it('should initialize with provided initial state', () => {
    const { result } = renderHook(() =>
      useFilterState({
        searchTerm: 'initial',
        page: 2,
        perPage: 20,
      })
    )

    expect(result.current.state.searchTerm).toBe('initial')
    expect(result.current.state.page).toBe(2)
    expect(result.current.state.perPage).toBe(20)
  })

  it('should update search term and reset page', () => {
    const { result } = renderHook(() => useFilterState())

    act(() => {
      result.current.setPage(5)
    })
    expect(result.current.state.page).toBe(5)

    act(() => {
      result.current.setSearchTerm('test query')
    })

    expect(result.current.state.searchTerm).toBe('test query')
    expect(result.current.state.page).toBe(1) // Should reset to 1
  })

  it('should update role filter and reset page', () => {
    const { result } = renderHook(() => useFilterState())

    act(() => {
      result.current.setPage(3)
      result.current.setRoleFilter('teacher')
    })

    expect(result.current.state.roleFilter).toBe('teacher')
    expect(result.current.state.page).toBe(1) // Should reset to 1
  })

  it('should update sort by and reset page', () => {
    const { result } = renderHook(() => useFilterState())

    act(() => {
      result.current.setPage(4)
      result.current.setSortBy('name_en')
    })

    expect(result.current.state.sortBy).toBe('name_en')
    expect(result.current.state.page).toBe(1) // Should reset to 1
  })

  it('should change page without resetting other filters', () => {
    const { result } = renderHook(() => useFilterState())

    act(() => {
      result.current.setSearchTerm('query')
      result.current.setRoleFilter('admin')
      result.current.setSortBy('name_en')
    })

    act(() => {
      result.current.setPage(2)
    })

    expect(result.current.state.page).toBe(2)
    expect(result.current.state.searchTerm).toBe('query')
    expect(result.current.state.roleFilter).toBe('admin')
    expect(result.current.state.sortBy).toBe('name_en')
  })

  it('should update per page and reset page', () => {
    const { result } = renderHook(() => useFilterState())

    act(() => {
      result.current.setPage(3)
      result.current.setPerPage(25)
    })

    expect(result.current.state.perPage).toBe(25)
    expect(result.current.state.page).toBe(1) // Should reset to 1
  })

  it('should reset to initial state', () => {
    const { result } = renderHook(() => useFilterState())

    act(() => {
      result.current.setSearchTerm('changed')
      result.current.setRoleFilter('teacher')
      result.current.setSortBy('name_en')
      result.current.setPage(3)
    })

    expect(result.current.state.searchTerm).toBe('changed')
    expect(result.current.state.roleFilter).toBe('teacher')
    expect(result.current.state.sortBy).toBe('name_en')
    expect(result.current.state.page).toBe(3)
    
    act(() => {
      result.current.setPerPage(50)
    })

    expect(result.current.state.perPage).toBe(50)
    expect(result.current.state.page).toBe(1) // Reset when perPage changes

    act(() => {
      result.current.reset()
    })

    expect(result.current.state.searchTerm).toBe('')
    expect(result.current.state.roleFilter).toBe('')
    expect(result.current.state.sortBy).toBe('name_ar')
    expect(result.current.state.page).toBe(1)
    expect(result.current.state.perPage).toBe(10)
  })
})

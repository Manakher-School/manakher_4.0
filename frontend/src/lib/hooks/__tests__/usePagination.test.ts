import { renderHook, act } from '@testing-library/react'
import { usePagination } from '../usePagination'

describe('usePagination', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePagination())

    expect(result.current.state.page).toBe(1)
    expect(result.current.state.perPage).toBe(10)
    expect(result.current.state.total).toBe(0)
    expect(result.current.state.totalPages).toBe(0)
  })

  it('should initialize with custom perPage', () => {
    const { result } = renderHook(() => usePagination(25))

    expect(result.current.state.perPage).toBe(25)
  })

  it('should set total and calculate totalPages', () => {
    const { result } = renderHook(() => usePagination(10))

    act(() => {
      result.current.setTotal(100)
    })

    expect(result.current.state.total).toBe(100)
    expect(result.current.state.totalPages).toBe(10)
  })

  it('should navigate to next page', () => {
    const { result } = renderHook(() => usePagination(10))

    act(() => {
      result.current.setTotal(100)
      result.current.nextPage()
    })

    expect(result.current.state.page).toBe(2)
  })

  it('should navigate to previous page', () => {
    const { result } = renderHook(() => usePagination(10))

    act(() => {
      result.current.setTotal(100)
      result.current.setPage(3)
      result.current.previousPage()
    })

    expect(result.current.state.page).toBe(2)
  })

  it('should not go below page 1', () => {
    const { result } = renderHook(() => usePagination(10))

    act(() => {
      result.current.previousPage()
    })

    expect(result.current.state.page).toBe(1)
  })

  it('should navigate to first page', () => {
    const { result } = renderHook(() => usePagination(10))

    act(() => {
      result.current.setTotal(100)
      result.current.setPage(5)
      result.current.goToFirstPage()
    })

    expect(result.current.state.page).toBe(1)
  })

  it('should navigate to last page', () => {
    const { result } = renderHook(() => usePagination(10))

    act(() => {
      result.current.setTotal(100)
      result.current.goToLastPage()
    })

    expect(result.current.state.page).toBe(10)
  })

  it('should change perPage and reset to first page', () => {
    const { result } = renderHook(() => usePagination(10))

    act(() => {
      result.current.setTotal(100)
      result.current.setPage(5)
      result.current.setPerPage(25)
    })

    expect(result.current.state.perPage).toBe(25)
    expect(result.current.state.page).toBe(1)
    expect(result.current.state.totalPages).toBe(4)
  })

  it('should reset pagination', () => {
    const { result } = renderHook(() => usePagination(15))

    act(() => {
      result.current.setTotal(100)
      result.current.setPage(5)
      result.current.setPerPage(50)
      result.current.reset()
    })

    expect(result.current.state.page).toBe(1)
    expect(result.current.state.perPage).toBe(15)
    expect(result.current.state.total).toBe(0)
    expect(result.current.state.totalPages).toBe(0)
  })

  it('should handle edge cases', () => {
    const { result } = renderHook(() => usePagination(10))

    act(() => {
      // Set total to 0
      result.current.setTotal(0)
    })

    expect(result.current.state.totalPages).toBe(0)

    act(() => {
      result.current.setPerPage(0) // Should become 1
    })

    expect(result.current.state.perPage).toBe(1)
  })
})

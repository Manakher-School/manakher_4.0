import { renderHook, act } from '@testing-library/react'
import { useInfiniteScroll } from '../useInfiniteScroll'

describe('useInfiniteScroll', () => {
  let mockCallback: jest.Mock
  let mockObserve: jest.Mock
  let mockDisconnect: jest.Mock
  let mockIntersectionObserver: jest.Mock
  let observerInstance: any

  beforeEach(() => {
    mockCallback = jest.fn()
    mockObserve = jest.fn()
    mockDisconnect = jest.fn()

    observerInstance = {
      observe: mockObserve,
      disconnect: mockDisconnect,
    }

    mockIntersectionObserver = jest.fn((callback) => {
      return observerInstance
    })

    ;(global as any).IntersectionObserver = mockIntersectionObserver
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return sentinel ref', () => {
    const { result } = renderHook(() => useInfiniteScroll(mockCallback))
    expect(result.current).toBeDefined()
    expect(result.current.current).toBeNull()
  })

  it('should use default options when not provided', () => {
    renderHook(() => useInfiniteScroll(mockCallback))

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { threshold: 0.1, rootMargin: '100px' }
    )
  })

  it('should pass custom options to IntersectionObserver', () => {
    renderHook(() =>
      useInfiniteScroll(mockCallback, { threshold: 0.5, rootMargin: '50px' })
    )

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { threshold: 0.5, rootMargin: '50px' }
    )
  })

  it('should disconnect observer on unmount', () => {
    const { unmount } = renderHook(() => useInfiniteScroll(mockCallback))

    act(() => {
      unmount()
    })

    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('should handle callback invocation from IntersectionObserver', () => {
    renderHook(() => useInfiniteScroll(mockCallback))

    // Get the callback passed to IntersectionObserver
    const observerCallback = mockIntersectionObserver.mock.calls[0][0]

    // Test that callback is called when entry is intersecting
    act(() => {
      observerCallback([{ isIntersecting: true }])
    })

    expect(mockCallback).toHaveBeenCalledTimes(1)
  })

  it('should not call callback when entries are not intersecting', () => {
    renderHook(() => useInfiniteScroll(mockCallback))

    const observerCallback = mockIntersectionObserver.mock.calls[0][0]

    act(() => {
      observerCallback([{ isIntersecting: false }])
    })

    expect(mockCallback).not.toHaveBeenCalled()
  })

  it('should call callback once for multiple entries if any intersects', () => {
    renderHook(() => useInfiniteScroll(mockCallback))

    const observerCallback = mockIntersectionObserver.mock.calls[0][0]

    act(() => {
      observerCallback([
        { isIntersecting: false },
        { isIntersecting: true },
        { isIntersecting: false },
      ])
    })

    expect(mockCallback).toHaveBeenCalledTimes(1)
  })

  it('should handle multiple intersecting entries', () => {
    renderHook(() => useInfiniteScroll(mockCallback))

    const observerCallback = mockIntersectionObserver.mock.calls[0][0]

    act(() => {
      observerCallback([
        { isIntersecting: true },
        { isIntersecting: true },
      ])
    })

    // Should be called twice (once for each intersecting entry)
    expect(mockCallback).toHaveBeenCalledTimes(2)
  })
})


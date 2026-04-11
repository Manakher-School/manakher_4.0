import { renderHook } from '@testing-library/react'
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

    mockIntersectionObserver = jest.fn(() => observerInstance)

    ;(global as any).IntersectionObserver = mockIntersectionObserver
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should create IntersectionObserver', () => {
    renderHook(() => useInfiniteScroll(mockCallback))
    expect(mockIntersectionObserver).toHaveBeenCalled()
  })

  it('should disconnect observer on unmount', () => {
    const { unmount } = renderHook(() => useInfiniteScroll(mockCallback))
    unmount()
    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('should call callback when sentinel intersects', () => {
    renderHook(() => useInfiniteScroll(mockCallback))

    const observerCallback = mockIntersectionObserver.mock.calls[0][0]
    observerCallback([{ isIntersecting: true }])

    expect(mockCallback).toHaveBeenCalled()
  })

  it('should not call callback when sentinel is not intersecting', () => {
    renderHook(() => useInfiniteScroll(mockCallback))

    const observerCallback = mockIntersectionObserver.mock.calls[0][0]
    observerCallback([{ isIntersecting: false }])

    expect(mockCallback).not.toHaveBeenCalled()
  })

  it('should return sentinel ref', () => {
    const { result } = renderHook(() => useInfiniteScroll(mockCallback))
    expect(result.current).toBeDefined()
    expect(result.current.current).toBeNull()
  })

  it('should handle multiple intersecting entries', () => {
    renderHook(() => useInfiniteScroll(mockCallback))

    const observerCallback = mockIntersectionObserver.mock.calls[0][0]
    observerCallback([
      { isIntersecting: false },
      { isIntersecting: true },
      { isIntersecting: false },
    ])

    expect(mockCallback).toHaveBeenCalledTimes(1)
  })

  it('should pass options to IntersectionObserver', () => {
    renderHook(() =>
      useInfiniteScroll(mockCallback, { threshold: 0.5, rootMargin: '50px' })
    )

    const callArgs = mockIntersectionObserver.mock.calls[0]
    expect(callArgs).toHaveLength(2)
    expect(typeof callArgs[0]).toBe('function') // callback
    // Options are passed (we can verify by checking the call)
  })
})


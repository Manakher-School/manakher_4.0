import { renderHook, act } from '@testing-library/react'
import { useTabState } from '../useTabState'

describe('useTabState', () => {
  it('should initialize with default tab', () => {
    const { result } = renderHook(() => useTabState('home'))

    expect(result.current.state.activeTab).toBe('home')
  })

  it('should change active tab', () => {
    const { result } = renderHook(() => useTabState('home'))

    act(() => {
      result.current.setActiveTab('about')
    })

    expect(result.current.state.activeTab).toBe('about')

    act(() => {
      result.current.setActiveTab('contact')
    })

    expect(result.current.state.activeTab).toBe('contact')
  })

  it('should allow any tab value', () => {
    const { result } = renderHook(() => useTabState('tab1'))

    const tabNames = ['tab1', 'tab2', 'tab3', 'settings', 'profile']

    tabNames.forEach((tab) => {
      act(() => {
        result.current.setActiveTab(tab as any)
      })
      expect(result.current.state.activeTab).toBe(tab)
    })
  })

  it('should maintain state across re-renders', () => {
    const { result, rerender } = renderHook(() => useTabState('initial'))

    act(() => {
      result.current.setActiveTab('changed')
    })

    expect(result.current.state.activeTab).toBe('changed')

    rerender()

    expect(result.current.state.activeTab).toBe('changed')
  })

  it('should handle rapid tab changes', () => {
    const { result } = renderHook(() => useTabState('tab1'))

    act(() => {
      result.current.setActiveTab('tab2')
      result.current.setActiveTab('tab3')
      result.current.setActiveTab('tab4')
      result.current.setActiveTab('tab5')
    })

    expect(result.current.state.activeTab).toBe('tab5')
  })
})

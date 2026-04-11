import { renderHook, act } from '@testing-library/react'
import { useTabState } from '../useTabState'

describe('useTabState', () => {
  it('should initialize with default tab', () => {
    const { result } = renderHook(() => useTabState('home'))

    expect(result.current.state.activeTab).toBe('home')
    expect(result.current.state.tabData).toEqual({})
  })

  it('should initialize with initial data', () => {
    const initialData = { home: { count: 0 }, about: { title: 'About' } }
    const { result } = renderHook(() => useTabState('home', initialData))

    expect(result.current.state.activeTab).toBe('home')
    expect(result.current.state.tabData).toEqual(initialData)
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

  it('should set tab data', () => {
    const { result } = renderHook(() => useTabState('home'))

    act(() => {
      result.current.setTabData('home', { items: [1, 2, 3] })
    })

    expect(result.current.state.tabData.home).toEqual({ items: [1, 2, 3] })

    act(() => {
      result.current.setTabData('about', { title: 'About Page' })
    })

    expect(result.current.state.tabData.about).toEqual({ title: 'About Page' })
    expect(result.current.state.tabData.home).toEqual({ items: [1, 2, 3] })
  })

  it('should update tab data partially', () => {
    const { result } = renderHook(() =>
      useTabState('home', {
        home: { count: 0, title: 'Home' },
        about: { title: 'About' },
      })
    )

    act(() => {
      result.current.updateTabData('home', { count: 1 })
    })

    expect(result.current.state.tabData.home).toEqual({ count: 1, title: 'Home' })
    expect(result.current.state.tabData.about).toEqual({ title: 'About' })
  })

  it('should create new tab data when updating non-existent tab', () => {
    const { result } = renderHook(() => useTabState('home'))

    act(() => {
      result.current.updateTabData('newTab', { data: 'value' })
    })

    expect(result.current.state.tabData.newTab).toEqual({ data: 'value' })
  })

  it('should allow any tab value', () => {
    const { result } = renderHook(() => useTabState('tab1'))

    const tabNames = ['tab1', 'tab2', 'tab3', 'settings', 'profile']

    tabNames.forEach((tab) => {
      act(() => {
        result.current.setActiveTab(tab)
      })
      expect(result.current.state.activeTab).toBe(tab)
    })
  })

  it('should maintain state across re-renders', () => {
    const { result, rerender } = renderHook(() => useTabState('initial'))

    act(() => {
      result.current.setActiveTab('changed')
      result.current.setTabData('changed', { data: 'value' })
    })

    expect(result.current.state.activeTab).toBe('changed')
    expect(result.current.state.tabData.changed).toEqual({ data: 'value' })

    rerender()

    expect(result.current.state.activeTab).toBe('changed')
    expect(result.current.state.tabData.changed).toEqual({ data: 'value' })
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

  it('should handle complex nested data structures', () => {
    const { result } = renderHook(() => useTabState('settings'))

    const complexData = {
      user: { id: 1, name: 'John', preferences: { theme: 'dark' } },
      notifications: [{ id: 1, message: 'New update' }],
    }

    act(() => {
      result.current.setTabData('settings', complexData)
    })

    expect(result.current.state.tabData.settings).toEqual(complexData)

    act(() => {
      result.current.updateTabData('settings', {
        user: { ...complexData.user, name: 'Jane' },
      })
    })

    expect(result.current.state.tabData.settings.user.name).toBe('Jane')
    expect(result.current.state.tabData.settings.notifications).toEqual([
      { id: 1, message: 'New update' },
    ])
  })
})

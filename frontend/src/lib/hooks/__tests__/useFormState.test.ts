import { renderHook, act } from '@testing-library/react'
import { useFormState } from '../useFormState'

interface TestFormData {
  name: string
  email: string
  age: number
}

describe('useFormState', () => {
  const initialData: TestFormData = {
    name: 'John',
    email: 'john@example.com',
    age: 30,
  }

  it('should initialize with provided data', () => {
    const { result } = renderHook(() => useFormState(initialData))

    expect(result.current.state.data).toEqual(initialData)
    expect(result.current.state.errors).toEqual({})
    expect(result.current.state.isDirty).toBe(false)
  })

  it('should set individual field values', () => {
    const { result } = renderHook(() => useFormState(initialData))

    act(() => {
      result.current.setFieldValue('name', 'Jane')
    })

    expect(result.current.state.data.name).toBe('Jane')
    expect(result.current.state.isDirty).toBe(true)
  })

  it('should update multiple fields with setData', () => {
    const { result } = renderHook(() => useFormState(initialData))

    act(() => {
      result.current.setData({
        ...result.current.state.data,
        name: 'Alice',
        email: 'alice@example.com',
      })
    })

    expect(result.current.state.data.name).toBe('Alice')
    expect(result.current.state.data.email).toBe('alice@example.com')
    expect(result.current.state.data.age).toBe(30)
  })

  it('should set field errors', () => {
    const { result } = renderHook(() => useFormState(initialData))

    act(() => {
      result.current.setFieldError('email', 'Invalid email')
    })

    expect(result.current.state.errors.email).toBe('Invalid email')
  })

  it('should clear all field errors', () => {
    const { result } = renderHook(() => useFormState(initialData))

    act(() => {
      result.current.setFieldError('email', 'Invalid email')
      result.current.setFieldError('name', 'Name is required')
    })

    expect(result.current.state.errors.email).toBe('Invalid email')
    expect(result.current.state.errors.name).toBe('Name is required')

    act(() => {
      result.current.clearErrors()
    })

    expect(result.current.state.errors).toEqual({})
  })

  it('should reset form to initial data', () => {
    const { result } = renderHook(() => useFormState(initialData))

    act(() => {
      result.current.setFieldValue('name', 'Changed')
      result.current.setFieldError('email', 'Invalid')
    })

    expect(result.current.state.data.name).toBe('Changed')
    expect(result.current.state.errors.email).toBe('Invalid')

    act(() => {
      result.current.reset()
    })

    expect(result.current.state.data).toEqual(initialData)
    expect(result.current.state.errors).toEqual({})
    expect(result.current.state.isDirty).toBe(false)
  })

  it('should mark form as dirty after changes', () => {
    const { result } = renderHook(() => useFormState(initialData))

    expect(result.current.state.isDirty).toBe(false)

    act(() => {
      result.current.setFieldValue('name', 'Updated')
    })

    expect(result.current.state.isDirty).toBe(true)
  })
})

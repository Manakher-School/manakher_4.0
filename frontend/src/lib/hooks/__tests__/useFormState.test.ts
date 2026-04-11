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
    expect(result.current.state.touched).toEqual({})
  })

  it('should set individual field values', () => {
    const { result } = renderHook(() => useFormState(initialData))

    act(() => {
      result.current.setFieldValue('name', 'Jane')
    })

    expect(result.current.state.data.name).toBe('Jane')
    expect(result.current.state.data.email).toBe('john@example.com')
  })

  it('should update multiple fields with setData', () => {
    const { result } = renderHook(() => useFormState(initialData))

    act(() => {
      result.current.setData({
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

  it('should set field touched', () => {
    const { result } = renderHook(() => useFormState(initialData))

    act(() => {
      result.current.setFieldTouched('name', true)
    })

    expect(result.current.state.touched.name).toBe(true)

    act(() => {
      result.current.setFieldTouched('name', false)
    })

    expect(result.current.state.touched.name).toBe(false)
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
      result.current.setFieldTouched('name', true)
    })

    expect(result.current.state.data.name).toBe('Changed')
    expect(result.current.state.errors.email).toBe('Invalid')
    expect(result.current.state.touched.name).toBe(true)

    act(() => {
      result.current.reset()
    })

    expect(result.current.state.data).toEqual(initialData)
    expect(result.current.state.errors).toEqual({})
    expect(result.current.state.touched).toEqual({})
  })

  it('should set all errors with setErrors', () => {
    const { result } = renderHook(() => useFormState(initialData))

    const errors = {
      name: 'Name is required',
      email: 'Invalid email format',
    }

    act(() => {
      result.current.setErrors(errors)
    })

    expect(result.current.state.errors).toEqual(errors)
  })
})

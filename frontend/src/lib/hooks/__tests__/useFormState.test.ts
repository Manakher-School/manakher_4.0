import { renderHook, act } from '@testing-library/react';
import { useFormState } from '@/lib/hooks/useFormState';

interface TestForm {
  name: string;
  email: string;
  age?: number;
}

const initialData: TestForm = {
  name: '',
  email: '',
  age: 0,
};

describe('useFormState', () => {
  it('should initialize with provided data', () => {
    const { result } = renderHook(() => useFormState<TestForm>(initialData));
    
    expect(result.current.state.data).toEqual(initialData);
    expect(result.current.state.errors).toEqual({});
    expect(result.current.state.touched).toEqual({});
  });

  it('should set field value', () => {
    const { result } = renderHook(() => useFormState<TestForm>(initialData));
    
    act(() => {
      result.current.setFieldValue('name', 'John Doe');
    });
    
    expect(result.current.state.data.name).toBe('John Doe');
  });

  it('should set multiple field values', () => {
    const { result } = renderHook(() => useFormState<TestForm>(initialData));
    
    act(() => {
      result.current.setFieldValue('name', 'Jane');
      result.current.setFieldValue('email', 'jane@example.com');
      result.current.setFieldValue('age', 25);
    });
    
    expect(result.current.state.data.name).toBe('Jane');
    expect(result.current.state.data.email).toBe('jane@example.com');
    expect(result.current.state.data.age).toBe(25);
  });

  it('should set form data in bulk', () => {
    const { result } = renderHook(() => useFormState<TestForm>(initialData));
    
    const newData: Partial<TestForm> = {
      name: 'Alice',
      email: 'alice@example.com',
    };
    
    act(() => {
      result.current.setData(newData);
    });
    
    expect(result.current.state.data.name).toBe('Alice');
    expect(result.current.state.data.email).toBe('alice@example.com');
  });

  it('should set field error', () => {
    const { result } = renderHook(() => useFormState<TestForm>(initialData));
    
    act(() => {
      result.current.setFieldError('email', 'Invalid email');
    });
    
    expect(result.current.state.errors.email).toBe('Invalid email');
  });

  it('should mark field as touched', () => {
    const { result } = renderHook(() => useFormState<TestForm>(initialData));
    
    act(() => {
      result.current.setTouched('name', true);
    });
    
    expect(result.current.state.touched.name).toBe(true);
  });

  it('should reset form to initial data', () => {
    const { result } = renderHook(() => useFormState<TestForm>(initialData));
    
    act(() => {
      result.current.setFieldValue('name', 'Test User');
      result.current.setFieldError('email', 'Error');
      result.current.setTouched('name', true);
    });
    
    expect(result.current.state.data.name).toBe('Test User');
    expect(result.current.state.errors.email).toBe('Error');
    expect(result.current.state.touched.name).toBe(true);
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.state.data).toEqual(initialData);
    expect(result.current.state.errors).toEqual({});
    expect(result.current.state.touched).toEqual({});
  });

  it('should clear all errors', () => {
    const { result } = renderHook(() => useFormState<TestForm>(initialData));
    
    act(() => {
      result.current.setFieldError('name', 'Name is required');
      result.current.setFieldError('email', 'Email is invalid');
    });
    
    expect(Object.keys(result.current.state.errors).length).toBe(2);
    
    act(() => {
      result.current.clearErrors();
    });
    
    expect(result.current.state.errors).toEqual({});
  });

  it('should clear all touched flags', () => {
    const { result } = renderHook(() => useFormState<TestForm>(initialData));
    
    act(() => {
      result.current.setTouched('name', true);
      result.current.setTouched('email', true);
    });
    
    expect(Object.keys(result.current.state.touched).length).toBe(2);
    
    act(() => {
      result.current.clearTouched();
    });
    
    expect(result.current.state.touched).toEqual({});
  });

  it('should provide access to form state object', () => {
    const { result } = renderHook(() => useFormState<TestForm>(initialData));
    
    act(() => {
      result.current.setFieldValue('name', 'Bob');
      result.current.setFieldError('email', 'Invalid');
      result.current.setTouched('name', true);
    });
    
    expect(result.current.state.data.name).toBe('Bob');
    expect(result.current.state.errors.email).toBe('Invalid');
    expect(result.current.state.touched.name).toBe(true);
  });

  it('should handle partial data updates', () => {
    const initialUser: TestForm = {
      name: 'Initial',
      email: 'initial@test.com',
      age: 30,
    };
    
    const { result } = renderHook(() => useFormState<TestForm>(initialUser));
    
    act(() => {
      result.current.setData({ name: 'Updated' }); // Only update name
    });
    
    expect(result.current.state.data.name).toBe('Updated');
    expect(result.current.state.data.email).toBe('initial@test.com'); // Unchanged
    expect(result.current.state.data.age).toBe(30); // Unchanged
  });
});

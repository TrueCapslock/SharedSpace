import { useEffect, useState } from 'react'

/** Returns `value` after it has been stable for `delay` ms. */
export function useDebouncedValue<T>(value: T, delay: number): [T, boolean] {
  const [debounced, setDebounced] = useState(value)
  const [settled, setSettled] = useState(true)

  useEffect(() => {
    setSettled(false)
    const timer = setTimeout(() => {
      setDebounced(value)
      setSettled(true)
    }, delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return [debounced, settled]
}

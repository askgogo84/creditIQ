/** @vitest-environment node */
import { afterEach, expect, it, vi } from 'vitest'
import { withRequestTimeout } from './request-timeout'
afterEach(() => vi.useRealTimers())
it('bounds a request even when it ignores abort, and signals cancellation', async () => {
  vi.useFakeTimers()
  let signal: AbortSignal | undefined
  const result = withRequestTimeout(s => { signal = s; return new Promise(() => {}) }, 50)
  const assertion = expect(result).rejects.toThrow('took too long')
  await vi.advanceTimersByTimeAsync(50)
  await assertion
  expect(signal?.aborted).toBe(true)
  expect(vi.getTimerCount()).toBe(0)
})
it('returns successful results and clears its timer', async () => {
  vi.useFakeTimers()
  expect(await withRequestTimeout(async () => 'ready')).toBe('ready')
  expect(vi.getTimerCount()).toBe(0)
})
it('preserves a real failure without leaving a timer', async () => {
  vi.useFakeTimers()
  await expect(withRequestTimeout(async () => { throw new Error('failed') })).rejects.toThrow('failed')
  expect(vi.getTimerCount()).toBe(0)
})

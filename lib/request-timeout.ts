/** Bound both session lookup and the request, including an unresponsive upstream. */
export async function withRequestTimeout<T>(request: (signal: AbortSignal) => Promise<T>, milliseconds = 30000): Promise<T> {
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      Promise.resolve().then(() => request(controller.signal)),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error('The request took too long. Please try again.'))
          controller.abort()
        }, milliseconds)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

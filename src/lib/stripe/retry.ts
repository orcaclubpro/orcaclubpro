/**
 * Shared retry utility for transient MongoDB write conflicts.
 * Used by webhook handlers and balance hooks that run concurrent Payload updates.
 * @see https://www.mongodb.com/docs/manual/core/retryable-writes/
 */
export async function retryOnTransientError<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
): Promise<T> {
  let lastError: any

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error

      const isTransient =
        error?.message?.includes('Write conflict') ||
        error?.code === 112 ||
        error?.codeName === 'WriteConflict' ||
        error?.errorLabels?.includes('TransientTransactionError')

      if (!isTransient || attempt === maxRetries) {
        throw error
      }

      // Exponential backoff: 200ms, 400ms, 800ms, 1600ms, 3200ms
      const delay = 200 * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

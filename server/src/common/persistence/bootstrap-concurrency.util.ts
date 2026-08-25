export function isPrismaUniqueConstraintViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

export async function retryBootstrapAfterUniqueConflict(
  operation: () => Promise<void>,
  maxAttempts = 4
): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await operation();
      return;
    } catch (error) {
      if (!isPrismaUniqueConstraintViolation(error) || attempt === maxAttempts) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, attempt * 50));
    }
  }
}

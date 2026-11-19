// SQLSTATE 23505 indica conflito com um valor que deveria ser único.
export function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  return 'code' in error && error.code === '23505';
}

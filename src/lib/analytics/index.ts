/**
 * Standalone analytics adapter.
 *
 * The original portfolio records demo interaction analytics. This extracted
 * application intentionally keeps analytics outside the polling domain.
 */
export function track(...args: unknown[]): Promise<void> {
  void args;
  return Promise.resolve();
}

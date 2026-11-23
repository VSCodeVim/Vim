/**
 * Timers for behavior that tests need to control, like the remap timeout. Tests replace these with
 * fake timers (see `newTest`), which would break VS Code if they replaced the global ones.
 */
export const timers = {
  setTimeout: (callback: () => void, ms: number): ReturnType<typeof setTimeout> =>
    setTimeout(callback, ms),
  clearTimeout: (handle: ReturnType<typeof setTimeout> | undefined): void => clearTimeout(handle),
};

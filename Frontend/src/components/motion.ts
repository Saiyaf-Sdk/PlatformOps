export const ease = [0.16, 1, 0.3, 1] as const;

export const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 18, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.7, delay, ease },
});

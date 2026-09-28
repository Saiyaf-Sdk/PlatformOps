export const ease = [0.16, 1, 0.3, 1] as const;
export const easeInOut = [0.65, 0, 0.35, 1] as const;

/** Fade-up with a soft blur — used for most entrances. */
export const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 22, filter: 'blur(10px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 1, delay, ease },
});

/** Same, but triggered when scrolled into view. */
export const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 28, filter: 'blur(10px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 1, delay, ease },
});

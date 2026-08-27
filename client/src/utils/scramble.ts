const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%&*0123456789';

/**
 * Scrambles an element's text content, then settles into the final string
 * character-by-character from left to right.
 *
 * @returns cleanup function — call on unmount to cancel any pending frames
 */
export function scrambleText(
  el: HTMLElement,
  finalText: string,
  duration = 900,
  onComplete?: () => void
): () => void {
  const totalFrames = Math.floor(duration / 35);
  let frame = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let cancelled = false;

  const run = () => {
    if (cancelled) return;

    if (frame >= totalFrames) {
      el.textContent = finalText;
      onComplete?.();
      return;
    }

    const settled = Math.floor((frame / totalFrames) * finalText.length);

    el.textContent = finalText
      .split('')
      .map((char, i) => {
        if (char === ' ') return '\u00a0';
        if (i < settled) return char;
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      })
      .join('');

    frame++;
    timeoutId = setTimeout(run, 35);
  };

  run();

  return () => {
    cancelled = true;
    if (timeoutId !== null) clearTimeout(timeoutId);
  };
}

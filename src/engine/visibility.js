export function bindPageVisibility(lifecycle, {
  documentRef = globalThis.document,
  onHidden = () => {},
  onVisible = () => {}
} = {}) {
  if (!documentRef?.addEventListener) return () => {};
  let active = true;
  const handler = () => {
    if (!active) return;
    if (documentRef.hidden) onHidden();
    else onVisible();
  };
  documentRef.addEventListener('visibilitychange', handler);
  const cleanup = () => {
    if (!active) return;
    active = false;
    documentRef.removeEventListener('visibilitychange', handler);
  };
  lifecycle?.add?.(cleanup);
  return cleanup;
}

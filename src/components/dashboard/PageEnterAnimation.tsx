/**
 * Enter animation for detail-route content. Pure CSS: the keyframe's `from`
 * state is applied by the browser before first paint (no flash of invisible
 * content), it honors prefers-reduced-motion, and it plays once when the detail
 * layout mounts — not on every intra-layout tab navigation.
 */
export function PageEnterAnimation({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>
}

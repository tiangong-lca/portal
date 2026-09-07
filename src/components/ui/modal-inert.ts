// Radix Select hides its background from assistive technology. Native inert
// also prevents that hidden background from receiving focus. Keep our own
// counters: aria-hidden's counters are shared across its different attributes.
const locks = new WeakMap<HTMLElement, { count: number; original: string | null }>();

export function isolateModalContent(content: HTMLElement) {
  const background: HTMLElement[] = [];
  let current: HTMLElement = content;
  while (current.parentElement) {
    const parent = current.parentElement;
    for (const sibling of parent.children) {
      if (sibling === current || !(sibling instanceof HTMLElement)) continue;
      const lock = locks.get(sibling) ?? { count: 0, original: sibling.getAttribute("inert") };
      lock.count += 1;
      locks.set(sibling, lock);
      sibling.setAttribute("inert", "");
      background.push(sibling);
    }
    if (parent === content.ownerDocument.body) break;
    current = parent;
  }
  return () => {
    for (const element of background) {
      const lock = locks.get(element)!;
      lock.count -= 1;
      if (lock.count > 0) continue;
      if (lock.original === null) element.removeAttribute("inert");
      else element.setAttribute("inert", lock.original);
      locks.delete(element);
    }
  };
}

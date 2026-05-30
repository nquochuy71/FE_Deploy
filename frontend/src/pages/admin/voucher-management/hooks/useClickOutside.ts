import { useEffect, type RefObject } from 'react';

export const useClickOutside = <T extends HTMLElement>(ref: RefObject<T | null>, onOutside: () => void, active = true) => {
  useEffect(() => {
    if (!active) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (ref.current?.contains(target)) {
        return;
      }

      onOutside();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [active, onOutside, ref]);
};

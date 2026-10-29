import { useCallback } from 'react';

/**
 * Hook to provide hardware-accelerated specular cursor tracking on cards.
 * Sets CSS custom properties --spot-x, --spot-y on the hovered element.
 */
export function useSpecularSpotlight() {
  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--spot-x', `${x}px`);
    e.currentTarget.style.setProperty('--spot-y', `${y}px`);
  }, []);

  return { handleMouseMove };
}

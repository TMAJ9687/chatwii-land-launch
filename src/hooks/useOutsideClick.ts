
import { useEffect, RefObject } from 'react';

/**
 * Hook to detect clicks outside a referenced element
 * @param ref - ref of the element to detect outside clicks for
 * @param onClickOutside - callback to run when a click occurs outside the element
 */
export function useOutsideClick(
  ref: RefObject<HTMLElement>,
  onClickOutside: () => void
) {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClickOutside();
      }
    }
    
    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, onClickOutside]);
}

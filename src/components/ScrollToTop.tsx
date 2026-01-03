import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component resets scroll position to top on route changes.
 * It does NOT scroll on hash changes (those are handled separately for smooth scrolling).
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Only scroll to top on pathname change (route change), not on hash change
    // Use 'auto' behavior to avoid "pop" effect - instant scroll
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
};

export default ScrollToTop;


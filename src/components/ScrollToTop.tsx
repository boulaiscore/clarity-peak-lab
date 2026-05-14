import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls the window to the top whenever the route pathname changes.
 * Mount once inside the Router. Prevents the inconsistent scroll
 * position users see when navigating between tabs/pages.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return null;
};

export default ScrollToTop;

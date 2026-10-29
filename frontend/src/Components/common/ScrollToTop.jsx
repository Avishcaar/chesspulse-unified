import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop Component
 * Ensures every page navigation starts at the very top (y = 0) of the viewport.
 * - Disables browser automatic scroll restoration to avoid landing halfway down pages.
 * - Immediately resets window, documentElement, and body scrollTop to 0 on route change.
 * - Handles hash navigation (e.g., #anchor) gracefully when an anchor is intentionally present.
 */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // Disable automatic browser scroll restoration so SPA navigations always start at top
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    // If a hash exists and matches an element on the page, scroll to it
    if (hash) {
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }

    // Otherwise, immediately force scroll to top on window and root elements
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

    // Follow-up microtask tick in case page mount causes async layout shift
    const rafId = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    });

    return () => cancelAnimationFrame(rafId);
  }, [pathname, search, hash]);

  return null;
}

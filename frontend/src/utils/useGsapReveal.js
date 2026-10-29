import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Custom hook to trigger high-fashion editorial typography reveals
 * on chapter headers when they scroll into the viewport.
 */
export function useGsapChapterReveal() {
  const headerRef = useRef(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof window === "undefined") return;

    // Respect reduced motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("cp-revealed");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add("cp-revealed");

            const meta = el.querySelector(".cp-chapter-meta");
            const title = el.querySelector(".cp-chapter-title");
            const desc = el.querySelector(".cp-chapter-desc");
            const actions = el.querySelector(".cp-chapter-actions");

            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

            if (meta) {
              tl.fromTo(
                meta,
                { opacity: 0, y: 12 },
                { opacity: 1, y: 0, duration: 0.5 }
              );
            }

            if (title) {
              tl.fromTo(
                title,
                { opacity: 0, y: 22 },
                { opacity: 1, y: 0, duration: 0.7 },
                "-=0.35"
              );
            }

            if (desc) {
              tl.fromTo(
                desc,
                { opacity: 0, y: 14 },
                { opacity: 1, y: 0, duration: 0.6 },
                "-=0.4"
              );
            }

            if (actions) {
              tl.fromTo(
                actions,
                { opacity: 0, x: 10 },
                { opacity: 1, x: 0, duration: 0.5 },
                "-=0.4"
              );
            }

            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  return headerRef;
}

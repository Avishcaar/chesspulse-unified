import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import gsap from "gsap";
import "./centerpiece.css";

const GrandmasterCenterpiece = forwardRef(function GrandmasterCenterpiece(
  { currentArena },
  ref
) {
  const card3dRef = useRef(null);
  const imgRef = useRef(null);

  useImperativeHandle(ref, () => ({
    triggerSpin: (onPeak) => {
      const el = imgRef.current;
      if (!el) return;

      if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
        onPeak?.();
        return;
      }

      const spinObj = { val: 0, blur: 0, scale: 1 };

      // Phase 1: Accelerate 0 -> 360 deg with motion blur
      gsap.to(spinObj, {
        val: 360,
        blur: 14,
        scale: 0.88,
        duration: 0.55,
        ease: "power2.in",
        onUpdate: () => {
          if (el) {
            el.style.filter = `blur(${spinObj.blur}px)`;
            el.style.transform = `scale(${spinObj.scale}) rotateY(${spinObj.val}deg)`;
          }
        },
        onComplete: () => {
          if (onPeak) onPeak();

          // Phase 2: Decelerate 360 -> 720 deg with elastic snap-back
          gsap.to(spinObj, {
            val: 720,
            blur: 0,
            scale: 1,
            duration: 0.85,
            ease: "back.out(1.4)",
            onUpdate: () => {
              if (el) {
                el.style.filter = `blur(${spinObj.blur}px)`;
                el.style.transform = `scale(${spinObj.scale}) rotateY(${spinObj.val}deg)`;
              }
            },
            onComplete: () => {
              if (el) {
                el.style.filter = "";
                el.style.transform = "";
              }
            },
          });
        },
      });
    },
  }));

  // Keep the artwork responsive to a mouse without a permanent animation loop.
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const stage = card3dRef.current?.closest(".centerpiece-stage-box");
    const card = card3dRef.current;
    if (!stage || !card || reducedMotion.matches || !finePointer.matches) return undefined;

    const handleMouseMove = (event) => {
      const rect = stage.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      gsap.to(card, {
        rotationX: -ny * 7,
        rotationY: nx * 9,
        transformPerspective: 1000,
        duration: 0.35,
        ease: "power2.out",
        overwrite: true,
      });
    };

    const resetTilt = () => {
      gsap.to(card, {
        rotationX: 0,
        rotationY: 0,
        duration: 0.55,
        ease: "power2.out",
        overwrite: true,
      });
    };

    stage.addEventListener("mousemove", handleMouseMove, { passive: true });
    stage.addEventListener("mouseleave", resetTilt);

    return () => {
      stage.removeEventListener("mousemove", handleMouseMove);
      stage.removeEventListener("mouseleave", resetTilt);
      gsap.killTweensOf(card);
    };
  }, []);

  return (
    <div className="centerpiece-stage-box">
      {/* 3D Cursor-Tilting & 720-Spinning Board Sculpture */}
      <div className="centerpiece-3d-pivot" ref={card3dRef}>
        <div className="centerpiece-float-bob">
          <img
            ref={imgRef}
            src="/assets/hero.png"
            alt="Sculptural chess pieces on a three-dimensional chessboard"
            className={`centerpiece-hero-img img-theme-${currentArena}`}
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
});

export default GrandmasterCenterpiece;

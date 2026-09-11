"use client";

import React, { useRef, useState, useCallback } from "react";

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // max degrees of tilt, default 5
  glowColor?: string; // spotlight glow color
  glowSize?: number; // radius of glow in px
}

export function TiltCard({
  children,
  className = "",
  maxTilt = 4,
  glowColor = "rgba(255, 255, 255, 0.12)",
  glowSize = 220,
  onClick,
  style,
  ...props
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setMousePos({ x, y });

      // Calculate tilt percentages (-1 to 1)
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const tiltX = -((y - centerY) / centerY) * maxTilt;
      const tiltY = ((x - centerX) / centerX) * maxTilt;

      setTilt({ x: tiltX, y: tiltY });
    },
    [maxTilt]
  );

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos(null);
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        perspective: "1000px",
        ...style,
      }}
      className={`group relative transition-transform duration-200 ease-out will-change-transform ${className}`}
      {...props}
    >
      {/* 3D Tilt & Pop-up Container */}
      <div
        style={{
          transform: isHovered
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-4px) scale3d(1.015, 1.015, 1.015)`
            : "rotateX(0deg) rotateY(0deg) translateY(0px) scale3d(1, 1, 1)",
          transition: isHovered
            ? "transform 0.12s cubic-bezier(0.16, 1, 0.3, 1)"
            : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          transformStyle: "preserve-3d",
        }}
        className="w-full h-full relative rounded-[inherit]"
      >
        {/* Children content */}
        {children}

        {/* Localized Cursor Glow (Only glows near the cursor point) */}
        {mousePos && isHovered && (
          <>
            {/* Inner surface soft glow */}
            <div
              className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 z-10"
              style={{
                background: `radial-gradient(${glowSize}px circle at ${mousePos.x}px ${mousePos.y}px, ${glowColor}, transparent 80%)`,
              }}
            />

            {/* Localized border beam / highlight only near cursor border */}
            <div
              className="pointer-events-none absolute -inset-[1px] rounded-[inherit] transition-opacity duration-300 z-20"
              style={{
                background: `radial-gradient(${glowSize * 0.7}px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.45), transparent 70%)`,
                WebkitMask:
                  "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                padding: "1px",
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

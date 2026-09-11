"use client";

import React, { useRef, useState } from "react";

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  tiltAngle?: number;
  glowColor?: string;
  glowSize?: number;
}

export function TiltCard({
  children,
  className = "",
  maxTilt,
  tiltAngle,
  glowColor = "rgba(255, 255, 255, 0.09)",
  glowSize = 250,
  onClick,
  style,
  ...props
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos(null);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: isHovered
          ? "translateY(-6px) scale(1.015)"
          : "translateY(0px) scale(1)",
        boxShadow: isHovered
          ? "0 18px 40px -12px rgba(0, 0, 0, 0.9), 0 0 26px -2px rgba(255, 255, 255, 0.10)"
          : undefined,
        borderColor: isHovered ? "rgba(255, 255, 255, 0.24)" : undefined,
        transition:
          "transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.22s ease",
        transformOrigin: "center center",
        ...style,
      }}
      className={`relative overflow-hidden will-change-transform ${className}`}
      {...props}
    >
      {/* Dynamic Cursor Card Glow */}
      {mousePos && isHovered && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-200 z-0"
          style={{
            background: `radial-gradient(${glowSize}px circle at ${mousePos.x}px ${mousePos.y}px, ${glowColor}, transparent 80%)`,
          }}
        />
      )}

      {/* Content Wrapper */}
      <div
        style={{
          display: "inherit",
          flexDirection: "inherit",
          justifyContent: "inherit",
          alignItems: "inherit",
          gap: "inherit",
        }}
        className="w-full h-full relative z-10"
      >
        {children}
      </div>
    </div>
  );
}



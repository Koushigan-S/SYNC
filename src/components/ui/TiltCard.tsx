"use client";

import React, { useState } from "react";

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  tiltAngle?: number; // tilt angle in degrees towards right, default 2.2
  maxTilt?: number;
}

export function TiltCard({
  children,
  className = "",
  tiltAngle,
  maxTilt,
  onClick,
  style,
  ...props
}: TiltCardProps) {
  const angle = tiltAngle ?? maxTilt ?? 2.2;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      style={style}
      className={`relative will-change-transform ${className}`}
      {...props}
    >
      {/* Pop-up & Rightward Tilt Container */}
      <div
        style={{
          transform: isHovered
            ? `translateY(-6px) rotate(${angle}deg) scale(1.02)`
            : "translateY(0px) rotate(0deg) scale(1)",
          transition: "transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
          transformOrigin: "center center",
        }}
        className="w-full h-full relative rounded-[inherit]"
      >
        {children}
      </div>
    </div>
  );
}

import React from "react";
import Image from "next/image";
import logoImg from "./job_hunt.png";

interface AppLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  className = "",
  size = "md",
  showText = false,
}) => {
  const sizeMap = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
    xl: "w-14 h-14",
  };

  const pxMap = {
    sm: 28,
    md: 36,
    lg: 44,
    xl: 56,
  };

  const iconSize = sizeMap[size] || sizeMap.md;
  const px = pxMap[size] || pxMap.md;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className={`relative flex items-center justify-center shrink-0 ${iconSize}`}>
        <Image
          src={logoImg}
          alt="sakto ka logo"
          width={px}
          height={px}
          className="w-full h-full object-contain rounded-lg drop-shadow-xs"
          priority
          unoptimized
        />
      </div>

      {showText && (
        <div>
          <h1 className="font-bold text-base tracking-tight text-foreground leading-none capitalize">
            sakto ka
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
            Career Intelligence System
          </p>
        </div>
      )}
    </div>
  );
};

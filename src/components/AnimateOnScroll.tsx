"use client";

import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

type AnimationProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  animation?: "fadeUp" | "fadeLeft" | "fadeRight" | "fadeIn" | "scaleUp";
};

export function AnimateOnScroll({
  children,
  className,
  delay = 0,
  animation = "fadeUp",
}: AnimationProps) {
  const { ref, isInView } = useInView();

  const animations = {
    fadeUp: "translate-y-8 opacity-0",
    fadeLeft: "-translate-x-8 opacity-0",
    fadeRight: "translate-x-8 opacity-0",
    fadeIn: "opacity-0",
    scaleUp: "scale-95 opacity-0",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        isInView ? "translate-y-0 translate-x-0 scale-100 opacity-100" : animations[animation],
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

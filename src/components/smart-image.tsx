import { ImageOff } from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  fallbackIcon?: ReactNode;
  eager?: boolean;
}

/** Lazy image with a gradient placeholder and a graceful gradient+icon fallback on error. */
export function SmartImage({ src, alt, className, imgClassName, fallbackIcon, eager }: SmartImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn("bg-fallback relative overflow-hidden", className)}>
      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center text-primary-foreground" role="img" aria-label={alt}>
          {fallbackIcon ?? <ImageOff className="size-8 opacity-80" aria-hidden />}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            "size-full object-cover transition-all duration-700",
            loaded ? "blur-0 scale-100 opacity-100" : "scale-105 opacity-0 blur-md",
            imgClassName,
          )}
        />
      )}
    </div>
  );
}

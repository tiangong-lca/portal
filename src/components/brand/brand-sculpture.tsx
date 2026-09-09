"use client";

import { useEffect, useRef, useState } from "react";
import type { LifecycleSculptureProps } from "./lifecycle/LifecycleSculpture";
import { SculptureOutline } from "./sculpture-outline";

type BrandSculptureProps = Pick<
  LifecycleSculptureProps,
  "locale" | "reducedMotion" | "unavailable" | "assetUrl"
>;
type SculptureComponent = typeof import("./lifecycle/LifecycleSculpture").LifecycleSculpture;

/**
 * Loads the optional renderer independently from the server-rendered brand page.
 * @import import { BrandSculpture } from "@/components/brand/brand-sculpture";
 */
export function BrandSculpture(props: BrandSculptureProps) {
  const [failed, setFailed] = useState(false);
  const [Renderer, setRenderer] = useState<SculptureComponent | null>(null);
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let mounted = true;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      void import("./lifecycle/LifecycleSculpture")
        .then((module) => {
          if (mounted) setRenderer(() => module.LifecycleSculpture);
        })
        .catch(() => {
          if (mounted) setFailed(true);
        });
    });
    if (host.current) observer.observe(host.current);
    return () => {
      mounted = false;
      observer.disconnect();
    };
  }, []);

  return (
    <div className="brand-sculpture" ref={host}>
      {Renderer ? (
        <Renderer {...props} presentation="hero" />
      ) : failed ? (
        <SculptureOutline />
      ) : null}
    </div>
  );
}

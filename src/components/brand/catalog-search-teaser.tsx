"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Search } from "lucide-react";

/** @import import { CatalogSearchTeaser } from "@/components/brand/catalog-search-teaser"; */
export function CatalogSearchTeaser({
  href,
  label,
  examples,
}: {
  href: string;
  label: string;
  examples: string[];
}) {
  const [text, setText] = useState(examples[0] ?? "");
  const [typing, setTyping] = useState(false);
  const hovered = useRef(false);
  const focused = useRef(false);
  const host = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let index = 0;
    let length = 0;
    let hold = 0;
    let ticks = 0;
    let done = false;
    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
    });
    if (host.current) observer.observe(host.current);
    const stop = () => {
      done = true;
      setTyping(false);
      setText(examples[index] ?? "");
    };
    const changed = () => {
      if (motion.matches) stop();
    };
    motion.addEventListener("change", changed);
    const timer = window.setInterval(() => {
      if (
        done ||
        motion.matches ||
        !visible ||
        document.hidden ||
        hovered.current ||
        focused.current ||
        !examples.length
      )
        return;
      // One short demonstration, then settle; no perpetual motion or live announcements.
      if (++ticks >= 60) {
        stop();
        return;
      }
      const example = examples[index] ?? "";
      if (length < example.length) {
        setText(example.slice(0, ++length));
        setTyping(true);
      } else {
        setTyping(false);
        if (++hold >= 9) {
          if (index === examples.length - 1) {
            stop();
            return;
          }
          index++;
          length = 0;
          hold = 0;
        }
      }
    }, 80);
    return () => {
      clearInterval(timer);
      observer.disconnect();
      motion.removeEventListener("change", changed);
    };
  }, [examples]);

  return (
    <a
      ref={host}
      className="catalog-search-teaser"
      href={href}
      aria-label={label}
      onMouseEnter={() => {
        hovered.current = true;
      }}
      onMouseLeave={() => {
        hovered.current = false;
      }}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={() => {
        focused.current = false;
      }}
    >
      <Search aria-hidden="true" />
      <span className="catalog-search-teaser-example" aria-hidden="true">
        {text}
        <span className="catalog-search-teaser-caret" data-typing={typing} />
      </span>
      <span className="catalog-search-teaser-action">
        {label}
        <ArrowRight aria-hidden="true" />
      </span>
    </a>
  );
}

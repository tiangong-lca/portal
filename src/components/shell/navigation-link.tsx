"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

function normalizePath(value: string) {
  const path = value.split("?", 1)[0]!.replace(/\/$/u, "") || "/";
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

export function NavigationLink({
  children,
  href,
  matchPrefix,
}: {
  children: ReactNode;
  href: string;
  matchPrefix?: string;
}) {
  const pathname = normalizePath(usePathname());
  const target = normalizePath(matchPrefix ?? href);
  const active = pathname === target || Boolean(matchPrefix && pathname.startsWith(`${target}/`));
  return (
    <Button asChild className="min-h-11" size="lg" variant={active ? "secondary" : "ghost"}>
      <Link aria-current={active ? "page" : undefined} href={href} prefetch={false}>
        {children}
      </Link>
    </Button>
  );
}

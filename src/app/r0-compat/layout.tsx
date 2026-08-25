import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "R0 compatibility matrix",
  robots: {
    follow: false,
    index: false,
  },
};

export default function R0CompatLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

import type { ReactNode } from "react";
import "./site-shell.css";
export function PortalPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main id="main-content" className="portal-page site-shell-container">
      <header className="portal-page-heading">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      {children}
    </main>
  );
}

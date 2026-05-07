//import React from "react";

export interface HeaderProps {
  title?: string;                       // fallback if no logo
  logo?: { src: string; alt: string };  // pass your image here
  onToggleSidebar?: () => void;
  onToggleTheme?: () => void;
  theme?: "light" | "dark";
}

export default function Header({
  title = "askKTU",
  logo,
}: HeaderProps) {
  return (
    <div className="header-brand">
      {logo ? (
        <a href="/" className="header-logo-link" aria-label={title}>
          <img
            src={logo.src}
            alt={logo.alt}
            className="header-logo-img"
          />
        </a>
      ) : (
        <h1 className="header-title-fallback">{title}</h1>
      )}
    </div>
  );
}

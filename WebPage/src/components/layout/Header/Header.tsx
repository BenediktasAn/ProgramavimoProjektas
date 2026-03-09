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
    <>
      <div>
        <div className="cluster">
          <h1>{title}</h1>
          {logo ? (
            <a href="/" aria-label="Home">
              <img
                src={logo.src}
                alt={logo.alt}
                style={{
                  height: 62,
                  width: "auto",
                  display: "block",
                  borderRadius: 8,
                }}
              />
            </a>
          ) : (
            <h1>{title}</h1>
          )}
        </div>
      </div>
        
    </>
  );
}

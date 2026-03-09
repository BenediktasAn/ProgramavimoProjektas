//import React from "react";
import { EXTERNAL_LINKS } from "../../../config";

export function TopNav() {
  return (
    <nav className="nav" aria-label="Primary">
      <a href="#home" aria-current="page">Home</a>
      <a href="#docs">Docs</a>
      <a href="#faq">FAQ</a>
      <a
        href={EXTERNAL_LINKS.ais}
        target="_blank"
        rel="noreferrer"
      >
        AIS
      </a>
      <a
        href={EXTERNAL_LINKS.moodle}
        target="_blank"
        rel="noreferrer"
      >
        Moodle
      </a>
    </nav>
  );
}

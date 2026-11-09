// The Android gallery page. Tokens and specimen parts are read from the desktop canon and never copied or edited here.
// The prose is site copy, so Codex writes it in copy.js. See ../README.md.
import React from "react";
import { COPY } from "./copy.js";
import { LayoutSection } from "./layout.jsx";
import { TokensSection } from "./tokens.jsx";

const NAV = [
  { id: "tokens", label: "Tokens" },
  { id: "layout", label: "Layout rules" },
];

function AndroidGallery() {
  return (
    <>
      <TokensSection />
      <LayoutSection />
    </>
  );
}

export const page = {
  nav: NAV,
  menuGroup: "Android",
  head: {
    title: "Android design",
    intro: COPY.intro || "A gallery for Tasty's Android design system: how tokens apply, layout rules, and shared components.",
    description: COPY.description || "A gallery for Tasty's Android design system, covering token usage, layout rules, and shared components.",
  },
  content: <AndroidGallery />,
};

export default function AndroidGalleryRoute() {
  return page.content;
}

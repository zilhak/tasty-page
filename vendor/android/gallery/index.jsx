// The Android gallery page. Tokens and specimen parts are read from the desktop canon and never copied or edited here.
// The prose below is site copy, so Codex writes it. See ../README.md.
import React from "react";
import { Note, Section } from "../../gallery/parts/specimen.jsx";

const NAV = [{ id: "status", label: "No specimens yet" }];

function AndroidGallery() {
  return (
    <Section id="status" title="No specimens yet">
      <Note>No specimens have been added yet.</Note>
    </Section>
  );
}

export const page = {
  nav: NAV,
  menuGroup: "Android",
  head: {
    title: "Android design",
    intro: "A gallery for Tasty's Android design system: how tokens apply, layout rules, and shared components.",
    description: "A gallery for Tasty's Android design system, covering token usage, layout rules, and shared components.",
  },
  content: <AndroidGallery />,
};

export default function AndroidGalleryRoute() {
  return page.content;
}

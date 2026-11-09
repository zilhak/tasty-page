// Foundations: the raw palette, tier 1, in both themes. This is the one place the page paints primitives,
// because they are its subject. A role reads them; UI does not (RULES.md section 14).
import React from "react";
import { Section, Spec, Stage, Meta, Note } from "../parts/specimen.jsx";
import { ThemePair } from "../parts/theme-frame.jsx";
import { Swatch, SwatchGrid } from "./swatch.jsx";

const NEUTRALS = [
  ["crust", 0], ["mantle", 100], ["base", 200], ["surface0", 300], ["surface1", 400], ["surface2", 500],
  ["overlay0", 600], ["overlay1", 700], ["overlay2", 800], ["subtext0", 900], ["subtext1", 1000], ["text", 1100],
];
const ACCENTS = ["blue", "green", "red", "yellow", "peach", "mauve", "teal", "sky", "lavender", "flamingo", "pink", "maroon", "rosewater"];

export function PaletteSection() {
  return (
    <Section id="palette" title="Color — raw palette">
      <Spec id="neutral-ramp" title="Surfaces, overlays and text: the neutral ramp"
        when={<>The dark elevation ramp runs from crust to surface2, followed by the overlay grays and text ramp. Latte supplies the light-theme ramp. <span className="ic">data-theme=latte</span> remaps the same names, so each step keeps its role and position in both frames. Roles reference these Tier 1 values. UI code reads the role, never these names.</>}>
        <Stage variant="solo">
          <ThemePair render={(theme) => (
            <SwatchGrid>
              {NEUTRALS.map(([name, step]) => <Swatch key={name} token={`color-neutral-${step}`} theme={theme} name={name} sub={`neutral-${step}`} />)}
            </SwatchGrid>
          )} />
        </Stage>
        <Meta
          specs={[["token", "color-neutral-<step>"], ["order", "step order, by role, not by lightness"], ["Latte subtext0", "#63667c, not upstream #6c6f85, which is 4.37:1 on base"]]}
          tokens={[
            { tok: "--tasty-text-primary", use: "text in both themes" },
            { tok: "--tasty-text-secondary", use: "subtext1 in both themes" },
            { tok: "--tasty-text-muted", use: "subtext0 in Mocha, subtext1 in Latte" },
            { tok: "--tasty-text-placeholder", use: "subtext0 in Mocha, subtext1 in Latte" },
            { tok: "--tasty-text-disabled", use: "overlay1 in Mocha, overlay2 in Latte" },
          ]} />
        <Note>A placeholder has no step of its own: it reads the muted step. overlay0, which it read before, is 2.57:1 on surface0.</Note>
      </Spec>

      <Spec id="catppuccin-accents" title="13 Catppuccin accents"
        when={<>The light-theme accent ramp uses the same 13 names with Latte values. Seven carry a role (Color — accent roles). The remaining six, teal, lavender, flamingo, pink, maroon and rosewater, have no status role.</>}>
        <Stage variant="solo">
          <ThemePair render={(theme) => (
            <SwatchGrid>
              {ACCENTS.map((name) => <Swatch key={name} token={`color-${name}`} theme={theme} name={name} sub={`color-${name}`} />)}
            </SwatchGrid>
          )} />
        </Stage>
        <Meta specs={[["token", "color-<hue>"], ["ramp", "none: one value per theme"]]} />
      </Spec>
    </Section>
  );
}

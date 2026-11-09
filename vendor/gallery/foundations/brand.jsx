// Foundations: the brand. The mark, its three colors, and the product surface it stands for.
import React from "react";
import { Section, Spec, Stage, Meta, Note } from "../parts/specimen.jsx";
import { Hex } from "./swatch.jsx";

const BASE = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/`;
const MONO = "var(--tasty-font-mono)";
const INK = {
  path: "var(--tasty-accent-success-raised)",
  branch: "var(--tasty-accent-primary-raised)",
  dim: "var(--tasty-text-muted)",
  tool: "var(--tasty-accent-attention-raised)",
  prompt: "var(--tasty-accent-agent-raised)",
  word: "var(--tasty-accent-warning-raised)",
};

function Mark({ size }) {
  return <img src={`${BASE}tasty-icon.png`} alt="Tasty logo" width={64} height={64}
    style={{ display: "block", flex: "none", width: size, height: size, imageRendering: "-webkit-optimize-contrast" }} />;
}

// A plate is the theme's terminal ground: black in Mocha and white in Latte, with that theme's text ink.
function LogoPlate({ theme }) {
  return (
    <div data-theme={theme} style={{ flex: "1 1 var(--tasty-size-288)", display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--tasty-space-sm)",
      padding: "var(--tasty-space-xl)", background: "var(--tasty-surface-terminal-focused-bg)" }}>
      <Mark size="var(--tasty-size-64)" />
      <span style={{ fontFamily: MONO, fontWeight: "var(--tasty-font-weight-bold)", fontSize: 38, letterSpacing: "var(--tasty-loading-lockup-tracking)", color: "var(--tasty-surface-terminal-focused-fg)" }}>
        tasty<span data-audit-exempt="brand" style={{ color: "var(--tasty-brand-melon-flesh)" }}>.</span>
      </span>
    </div>
  );
}

const MELON = ["flesh", "rind", "seed"];

function S({ ink, children }) {
  return <span style={{ color: INK[ink] }}>{children}</span>;
}

function TerminalSample() {
  return (
    <div style={{ width: "100%", padding: "var(--tasty-space-md) var(--tasty-space-lg)", background: "var(--tasty-surface-terminal-focused-bg)", color: "var(--tasty-surface-terminal-focused-fg)",
      border: "var(--tasty-border-width) solid var(--tasty-border-default)", borderRadius: "var(--tasty-radius)", fontFamily: MONO, fontSize: "var(--tasty-font-size-term)", lineHeight: "var(--tasty-line-height-140)", whiteSpace: "pre", overflowX: "auto" }}>
      <div><S ink="path">~/tasty</S> <S ink="branch">main</S> <S ink="dim">via</S> <S ink="tool">rust v1.84</S></div>
      <div><S ink="prompt">❯</S> cargo build --release</div>
      <div><S ink="dim">   Compiling</S> tasty-themes <S ink="dim">v0.7.0</S></div>
      <div><S ink="dim">   Compiling</S> tasty-type-appearance <S ink="dim">v0.7.0</S></div>
      <div><S ink="path">    Finished</S> <S ink="word">release</S> [optimized] target(s) in <S ink="tool">42.18s</S></div>
      <div><S ink="prompt">❯</S> tasty --headless <S ink="dim"># agent-driven surface, no GUI</S></div>
      <div><S ink="branch">surface</S> <S ink="path">created</S> id=<S ink="word">s_01HX</S> kind=terminal <span style={{ background: "var(--tasty-surface-terminal-focused-fg)" }}>{" "}</span></div>
    </div>
  );
}

export function BrandSection() {
  return (
    <Section id="brand" title="Brand">
      <Spec id="logo-and-wordmark" title="Logo & wordmark"
        when={<>Watermelon-slice mark + monospace wordmark. The lockup sits on a dark plate and a light plate, and only the word changes ink: the mark and the dot keep their colors on both.</>}>
        <Stage variant="tight" style={{ flexWrap: "wrap", gap: 0 }}>
          <LogoPlate theme="mocha" />
          <LogoPlate theme="latte" />
        </Stage>
        <Meta
          specs={[["mark", <>64 × 64 <span className="tok">--tasty-size-64</span></>], ["mark to word", <span className="tok">--tasty-space-sm</span>], ["word", "mono 38px, weight 700"], ["tracking", <span className="tok">--tasty-loading-lockup-tracking</span>], ["dark plate", "#000000, the terminal ground in Mocha"], ["light plate", "#ffffff, the terminal ground in Latte"]]}
          tokens={[
            { tok: "--tasty-surface-terminal-focused-bg", use: "the plates: Mocha for dark, Latte for light" },
            { tok: "--tasty-surface-terminal-focused-fg", use: "word: #cdd6f4 on the dark plate, #4c4f69 on the light plate" },
            { tok: "--tasty-brand-melon-flesh", use: "wordmark dot, the mark and not text", color: "var(--tasty-brand-melon-flesh)" },
            { tok: "--tasty-font-mono", use: "the word" },
            { tok: "--tasty-font-weight-bold", use: "the word" },
          ]} />
        <Note>The mark-to-word gap is the same as the sidebar's. The same lockup opens the boot screen (Startup).</Note>
      </Spec>

      <Spec id="watermelon-palette" title="Watermelon palette"
        when={<>The three mark colors + their token names. They are the same in both themes. They paint the mark: the brand as text or a glyph is <span className="tok">--tasty-brand-ink</span> (Share image).</>}>
        <Stage variant="solo" style={{ alignItems: "center", gap: "var(--tasty-space-lg)" }}>
          <Mark size="var(--tasty-size-56)" />
          {MELON.map((name) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: "var(--tasty-space-md)" }}>
              <span style={{ width: "var(--tasty-size-56)", height: "var(--tasty-size-56)", flex: "none", background: `var(--tasty-brand-melon-${name})`, border: "var(--tasty-border-width) solid var(--tasty-separator)", borderRadius: "var(--tasty-radius)" }} />
              <div>
                <div style={{ fontSize: "var(--tasty-font-size-body)", fontWeight: "var(--tasty-font-weight-semibold)", color: "var(--tasty-text-primary)" }}>{name}</div>
                <div style={{ fontFamily: MONO, fontSize: "var(--tasty-font-size-micro)", color: "var(--tasty-text-muted)" }}><Hex name={`brand-melon-${name}`} theme="mocha" /></div>
                <div style={{ fontFamily: MONO, fontSize: "var(--tasty-font-size-micro)", color: "var(--tasty-text-muted)" }}>--tasty-brand-melon-{name}</div>
              </div>
            </div>
          ))}
        </Stage>
        <Meta tokens={MELON.map((name) => ({ tok: `--tasty-brand-melon-${name}`, use: `${name}, one value for Mocha and Latte`, color: `var(--tasty-brand-melon-${name})` }))} />
      </Spec>

      <Spec id="terminal-specimen" title="Terminal specimen"
        when={<>The product surface on its own ground, set in a frame on the page ground. It follows the theme, as the app's focused terminal does. A prompt is the <span className="ic">❯</span> an OSC-133 shell reports; the sequence paints nothing, so no mark of it shows here.</>}>
        <Stage variant="solo" style={{ background: "var(--tasty-bg-app)" }}>
          <TerminalSample />
        </Stage>
        <Meta
          specs={[["size", <span className="tok">--tasty-font-size-term</span>], ["prompt", "❯, agent ink"], ["cursor", <>block, <span className="tok">--tasty-surface-terminal-focused-fg</span></>]]}
          tokens={[
            { tok: "--tasty-surface-terminal-focused-bg", use: "ground: black in Mocha, white in Latte", color: "var(--tasty-surface-terminal-focused-bg)" },
            { tok: "--tasty-surface-terminal-focused-fg", use: "default cell ink", color: "var(--tasty-surface-terminal-focused-fg)" },
            { tok: "--tasty-text-muted", use: "dim words", color: "var(--tasty-text-muted)" },
            { tok: "--tasty-accent-success-raised", use: "path, success words", color: "var(--tasty-accent-success-raised)" },
            { tok: "--tasty-accent-primary-raised", use: "branch, object", color: "var(--tasty-accent-primary-raised)" },
            { tok: "--tasty-accent-agent-raised", use: "prompt", color: "var(--tasty-accent-agent-raised)" },
            { tok: "--tasty-accent-warning-raised", use: "keyword, id", color: "var(--tasty-accent-warning-raised)" },
            { tok: "--tasty-accent-attention-raised", use: "tool version, time", color: "var(--tasty-accent-attention-raised)" },
          ]} />
        <Note>This is a figure, drawn by this page and not by a program, so its lines read the <span className="ic">term</span> cells of the rules and are measured. Real output is <span className="ic">ansi-*</span>, as the terminal palette below says. The commands and versions are sample text, not a statement about a release.</Note>
      </Spec>
    </Section>
  );
}

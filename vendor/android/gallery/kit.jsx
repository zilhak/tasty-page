// Small pieces the Android sections share. Values come from the canon at render time, so nothing here can drift from it.
import React, { useEffect, useState } from "react";
import { resolveToken } from "../../gallery/parts/state-grid.jsx";
import { Note } from "../../gallery/parts/specimen.jsx";
import { COPY } from "./copy.js";

// The resolved value of a token. With a theme, the color in that theme.
export function TokenValue({ name, theme }) {
  const [value, set] = useState("");
  useEffect(() => { set(resolveToken(name, theme)); }, [name, theme]);
  return <>{value}</>;
}

// A token's length as a number, for the tables that compare against it.
export const lengthOf = (name) => parseFloat(resolveToken(name));

// A table in the gallery's own form. mono: the column indexes drawn in the mono face.
export function SpecTable({ head, rows, mono = [] }) {
  return (
    <div className="spec-table" tabIndex={0} style={{ marginTop: "var(--tasty-space-md)" }}>
      <table>
        <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => <td key={j} className={mono.includes(j) ? "m" : undefined}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Page prose. Codex writes it in copy.js, so a slot with no text yet draws nothing.
export function Prose({ k }) {
  return COPY[k] ? <Note>{COPY[k]}</Note> : null;
}

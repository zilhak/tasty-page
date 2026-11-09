// Touch against the canon. This section measures and compares. It changes no value and proposes none: the reference box
// marks the comparison baseline, and which values change, if any, is the user's decision.
import React, { useEffect, useRef, useState } from "react";
import { AutoComplete, Button, Checkbox, HelpHint, Icon, IconButton, Input, ListCtrl, MenuItem, MultiSelect, SearchableSelect, Select, Switch, Tab, Table, TreeRow } from "../../components/index.js";
import { Cluster, Section, Spec, Stage, View, Views } from "../../gallery/parts/specimen.jsx";
import { COPY } from "./copy.js";
import { lengthOf, Prose, SpecTable, TokenValue } from "./kit.jsx";

const noop = () => {};
const wide = { width: "var(--tasty-field-width-lg)" };
const plus = <Icon name="plus" />;
const listItems = [{ id: "a", label: "Label" }, { id: "b", label: "Label" }];

// sel finds the target inside the sample. token is what sets its height in the canon.
const TARGETS = [
  { id: "button-lg", label: "Button, large", token: "button-height-lg", sel: ".tasty-btn", node: <Button size="lg">Label</Button> },
  { id: "button", label: "Button", token: "button-height", sel: ".tasty-btn", node: <Button>Label</Button> },
  { id: "button-sm", label: "Button, small", token: "button-height-sm", sel: ".tasty-btn", node: <Button size="sm">Label</Button> },
  { id: "iconbutton", label: "IconButton", token: "icon-button-size", sel: ".tasty-iconbtn", node: <IconButton aria-label="Add">{plus}</IconButton> },
  { id: "iconbutton-sm", label: "IconButton, small", token: "icon-button-size-sm", sel: ".tasty-iconbtn", node: <IconButton size="sm" aria-label="Add">{plus}</IconButton> },
  { id: "input", label: "Input", token: "input-height", sel: ".tasty-input", node: <Input value="Value" onChange={noop} style={wide} /> },
  { id: "select", label: "Select", token: "select-height", sel: "select", node: <Select options={["Value"]} /> },
  { id: "searchable-select", label: "SearchableSelect", token: "control-height", sel: "button", node: <SearchableSelect options={["Value"]} /> },
  { id: "multiselect", label: "MultiSelect", token: "control-height", sel: ".tasty-mselect__trigger", node: <MultiSelect options={["Value"]} defaultValue={[]} /> },
  { id: "autocomplete", label: "AutoComplete", token: "control-height", sel: ".tasty-ac__field", node: <AutoComplete items={["Value"]} query="" /> },
  { id: "checkbox", label: "Checkbox", token: "checkbox-size", sel: ".tasty-check", node: <Checkbox aria-label="Label" /> },
  { id: "checkbox-label", label: "Checkbox with a label", token: "checkbox-size", sel: ".tasty-check", node: <Checkbox label="Label" /> },
  { id: "switch", label: "Switch", token: "switch-track-height", sel: ".tasty-switch", node: <Switch aria-label="Label" /> },
  { id: "switch-label", label: "Switch with a label", token: "switch-track-height", sel: ".tasty-switch", node: <Switch label="Label" /> },
  { id: "tab", label: "Tab", token: "tab-height", sel: ".tasty-tab", node: <Tab label="Label" active /> },
  { id: "tab-close", label: "Tab close", token: "tab-close-size", sel: ".tasty-tab__close", node: <Tab label="Label" active /> },
  { id: "treerow", label: "TreeRow", token: "tree-row-height", sel: ".tasty-treerow", node: <div style={wide}><TreeRow label="Label" /></div> },
  { id: "menuitem", label: "MenuItem", token: "menu-item-height", sel: ".tasty-menuitem", node: <div style={wide}><MenuItem label="Label" /></div> },
  { id: "listctrl", label: "ListCtrl row", token: "listctrl-row-min-height", sel: ".tasty-listctrl__row", node: <div style={wide}><ListCtrl items={[listItems[0]]} onSelect={noop} /></div> },
  { id: "table", label: "Table row", token: "table-cell-height", sel: ".tasty-table__row", node: <div style={wide}><Table columns={[{ key: "a", header: "Name" }]} rows={[{ a: "Cell" }]} rowKey="a" onRowClick={noop} /></div> },
  { id: "helphint", label: "HelpHint", token: "help-hint-size", sel: ".tasty-help-hint__glyph", node: <HelpHint label="Label" /> },
];

// Two targets side by side or stacked, and what separates them.
const GAPS = [
  { id: "tree", label: "TreeRow above TreeRow", sel: ".tasty-treerow", node: <><TreeRow label="Label" /><TreeRow label="Label" /></> },
  { id: "menu", label: "MenuItem above MenuItem", sel: ".tasty-menuitem", node: <><MenuItem label="Label" /><MenuItem label="Label" /></> },
  { id: "list", label: "ListCtrl row above ListCtrl row", sel: ".tasty-listctrl__row", node: <ListCtrl items={listItems} onSelect={noop} /> },
  { id: "table", label: "Table row above Table row", sel: ".tasty-table__row", node: <Table columns={[{ key: "a", header: "Name" }]} rows={[{ a: "Cell" }, { a: "Second" }]} rowKey="a" onRowClick={noop} /> },
];

// Type against the default Material 3 scale, the one Compose starts from.
const TYPE_COMPARE = [["font-size-micro", "labelSmall", 11], ["font-size-caption", "labelSmall", 11], ["font-size-body", "bodyMedium", 14], ["font-size-max", "bodyLarge", 16]];

// A fixed height and the text it holds, at the 200% font size Android 14 allows.
const FONT_SCALE = [
  ["Control", "control-height", "font-size-body"],
  ["Small control", "button-height-sm", "font-size-caption"],
  ["Tab", "tab-height", "font-size-body"],
  ["Tree row", "tree-row-height", "font-size-body"],
];

const SOURCES = [
  ["48 by 48 touch target", "Android Developers, Make apps more accessible", "https://developer.android.com/guide/topics/ui/accessibility/apps"],
  ["48 minimum in Compose, and how it reserves space", "Android Developers, Compose accessibility defaults", "https://developer.android.com/develop/ui/compose/accessibility/api-defaults"],
  ["8 between targets", "Android Accessibility Help, Touch target size", "https://support.google.com/accessibility/android/answer/7101858"],
  ["24 by 24 CSS pixels, level AA", "WCAG 2.2, 2.5.8 Target Size (Minimum)", "https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html"],
  ["Material 3 default type scale", "Android Developers, Material Design 3 in Compose", "https://developer.android.com/develop/ui/compose/designsystems/material3"],
  ["Font scale up to 200%, nonlinear", "Android Developers, Android 14 features", "https://developer.android.com/about/versions/14/features"],
];

const px = (n) => `${Math.round(n * 10) / 10}`;

export function TouchSection() {
  const targetsRef = useRef(null);
  const gapsRef = useRef(null);
  const [sizes, setSizes] = useState({});
  const [gaps, setGaps] = useState({});
  const [lengths, setLengths] = useState(null);

  useEffect(() => {
    let live = true;
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
      if (!live) return;
      const next = {};
      TARGETS.forEach((t) => {
        const box = targetsRef.current.querySelector(`[data-touch-target="${t.id}"] ${t.sel}`);
        if (box) { const r = box.getBoundingClientRect(); next[t.id] = { w: r.width, h: r.height }; }
      });
      setSizes(next);
      const between = {};
      GAPS.forEach((g) => {
        const [a, b] = gapsRef.current.querySelectorAll(`[data-touch-gap="${g.id}"] ${g.sel}`);
        if (a && b) between[g.id] = b.getBoundingClientRect().top - a.getBoundingClientRect().bottom;
      });
      setGaps(between);
      setLengths({ target: lengthOf("size-48"), gap: lengthOf("size-8"), lineHeight: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--tasty-line-height-ui")) });
    });
    return () => { live = false; };
  }, []);

  const target = lengths ? lengths.target : 0;
  const shortBy = (s) => {
    if (!s || !target) return "";
    const parts = [s.w < target ? `width ${px(target - s.w)}` : null, s.h < target ? `height ${px(target - s.h)}` : null].filter(Boolean);
    return parts.length ? parts.join(", ") : "Meets";
  };

  return (
    <Section id="touch" title="Touch">
      <Spec id="touch-targets" title="Touch targets" when={COPY.touchTargetsWhen}>
        <div ref={targetsRef}>
          <Stage eager>
            {TARGETS.map((t) => (
              <Cluster key={t.id} label={t.label}>
                <div data-touch-target={t.id} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "var(--tasty-size-48)", minHeight: "var(--tasty-size-48)", border: "var(--tasty-border-width) dashed var(--tasty-border-control)" }}>{t.node}</div>
              </Cluster>
            ))}
          </Stage>
        </div>
        <SpecTable head={["Part", "Token", "Token value", "Measured", "Baseline", "Short by"]} mono={[1, 2, 3, 4]}
          rows={TARGETS.map((t) => [t.label, t.token, <TokenValue name={t.token} />, sizes[t.id] ? `${px(sizes[t.id].w)} x ${px(sizes[t.id].h)}` : "", target ? `${target} x ${target}` : "", shortBy(sizes[t.id])])} />
        <Prose k="touchTargetsNote" />
      </Spec>
      <Spec id="touch-gaps" title="Space between targets" when={COPY.touchGapsWhen}>
        <div ref={gapsRef}>
          <Stage eager>
            {GAPS.map((g) => <Cluster key={g.id} label={g.label}><div data-touch-gap={g.id} style={wide}>{g.node}</div></Cluster>)}
          </Stage>
        </div>
        <SpecTable head={["Pair", "Gap", "Baseline"]} mono={[1, 2]}
          rows={[...GAPS.map((g) => [g.label, gaps[g.id] === undefined ? "" : px(gaps[g.id]), lengths ? lengths.gap : ""]),
            ["Popup title buttons", <>popup-title-btn-gap <TokenValue name="popup-title-btn-gap" /></>, lengths ? lengths.gap : ""],
            ["Tab close beside the busy dot", <>tab-status-gap <TokenValue name="tab-status-gap" /></>, "The dot is not a target"]]} />
      </Spec>
      <Spec id="touch-type" title="Type size" when={COPY.touchTypeWhen}>
        <SpecTable head={["Token", "Value", "Material 3 default", "Size"]} mono={[0, 1, 2, 3]}
          rows={TYPE_COMPARE.map(([name, role, size]) => [name, <TokenValue name={name} />, role, size])} />
        <Prose k="touchTypeNote" />
      </Spec>
      <Spec id="touch-font-scale" title="Font scale" when={COPY.touchFontScaleWhen}>
        <SpecTable head={["Place", "Height token", "Height", "Type token", "Line at 200%", "Over by"]} mono={[1, 2, 3, 4, 5]}
          rows={FONT_SCALE.map(([place, height, type]) => {
            const h = lengths ? lengthOf(height) : 0;
            const line = lengths ? lengthOf(type) * 2 * lengths.lineHeight : 0;
            return [place, height, <TokenValue name={height} />, type, lengths ? px(line) : "", lengths ? px(Math.max(0, line - h)) : ""];
          })} />
        <Prose k="touchFontScaleNote" />
      </Spec>
      <Spec id="touch-hover" title="What waits for a pointer or a keyboard" when={COPY.touchHoverWhen}>
        <Views>
          <View name="tab-active" label="Tab, active"><Tab label="Label" active /></View>
          <View name="tab-rest" label="Tab, at rest"><Tab label="Label" /></View>
        </Views>
        <SpecTable head={["Part", "What it waits for"]}
          rows={[["Tab close", "Hover, on an inactive tab"], ["Table sort mark", "Hover, on a sortable header"], ["Tooltip, HelpHint", "Hover or keyboard focus"], ["Hover column of every state grid", "A pointer"], ["Keyboard-active rows", "A keyboard"], ["Kbd", "A keyboard"]]} />
        <Prose k="touchHoverNote" />
      </Spec>
      <Spec id="touch-sources" title="Where the baselines come from" when={COPY.touchSourcesWhen}>
        <SpecTable head={["Baseline", "Source"]}
          rows={SOURCES.map(([what, title, href]) => [what, <a href={href} style={{ textDecoration: "underline" }}>{title}</a>])} />
      </Spec>
    </Section>
  );
}

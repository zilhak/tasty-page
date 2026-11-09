// Phone and tablet widths. The canon has no value for these, so the numbers below are Android's own window size classes
// and are declared here. Which of them the app supports is an open product decision, so the frames show the same parts
// at each width and arrange nothing: no panes, no navigation, no screens.
import React, { useEffect, useState } from "react";
import { Button, Icon, IconButton, Input, ListCtrl, Select, Tab, Toast } from "../../components/index.js";
import { Section, Spec, Stage } from "../../gallery/parts/specimen.jsx";
import { COPY } from "./copy.js";
import { lengthOf, Prose, SpecTable, TokenValue } from "./kit.jsx";

const CLASSES_SOURCE = "https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes";
const CLASSES = [
  ["Compact", "width < 600", "99.96% of phones in portrait"],
  ["Medium", "600 ≤ width < 840", "93.73% of tablets in portrait, most large unfolded inner displays in portrait"],
  ["Expanded", "840 ≤ width < 1200", "97.22% of tablets in landscape"],
  ["Large", "1200 ≤ width < 1600", "Large tablet displays"],
  ["Extra-large", "width ≥ 1600", "Desktop displays"],
];
// 600 and 840 are the lower bounds of two classes. 360 is a test width for a narrow phone, chosen here and not from a source.
const FRAMES = [{ width: 360, label: "Compact, narrow phone" }, { width: 600, label: "Medium, lower bound" }, { width: 840, label: "Expanded, lower bound" }];
const FITS = ["toast-max-width", "tooltip-max-width", "field-width-lg", "measure-sm", "measure-md", "measure-lg", "measure-xl"];

const noop = () => {};
const items = [{ id: "a", label: "Label", description: "Description", icon: <Icon name="file" /> }, { id: "b", label: "Label", description: "Description", icon: <Icon name="file" /> }];

function Frame({ width, label }) {
  return (
    <figure className="fixed-view" data-view={`width-${width}`} style={{ margin: 0 }}>
      <figcaption>{width} dp, {label}</figcaption>
      <Stage eager variant="tight">
        <div style={{ flex: "none", width: `${width}px`, display: "flex", flexDirection: "column", gap: "var(--tasty-space-md)", padding: "var(--tasty-space-lg)", background: "var(--tasty-bg-app)" }}>
          <div style={{ display: "flex", overflow: "hidden", borderBottom: "var(--tasty-border-width) solid var(--tasty-separator)" }}>
            {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} style={{ flex: "none" }}><Tab label="Label" active={i === 0} /></div>)}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--tasty-space-sm)" }}>
            <Button variant="primary">Label</Button>
            <Button>Label</Button>
            <IconButton aria-label="Add"><Icon name="plus" /></IconButton>
          </div>
          <Input block value="Value" onChange={noop} />
          <Select block options={["Value"]} />
          <div style={{ background: "var(--tasty-bg-panel)" }}><ListCtrl items={items} onSelect={noop} /></div>
          <Toast variant="info" icon={<Icon name="info" />}>Label</Toast>
        </div>
      </Stage>
    </figure>
  );
}

export function WidthsSection() {
  const [fit, setFit] = useState(null);
  useEffect(() => {
    const tab = lengthOf("tab-width");
    setFit({ tab, sizes: Object.fromEntries(FITS.map((name) => [name, lengthOf(name)])) });
  }, []);
  return (
    <Section id="widths" title="Phone and tablet widths">
      <Spec id="width-classes" title="Window size classes" when={COPY.widthClassesWhen}>
        <SpecTable head={["Class", "Width in dp", "What Android says it represents"]} mono={[1]} rows={CLASSES} />
        <p className="spec-note"><a href={CLASSES_SOURCE}>Android Developers, Use window size classes</a></p>
        <Prose k="widthClassesNote" />
      </Spec>
      <Spec id="width-frames" title="The same parts at each width" when={COPY.widthFramesWhen}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--tasty-space-lg)" }}>
          {FRAMES.map((f) => <Frame key={f.width} {...f} />)}
        </div>
        <Prose k="widthFramesNote" />
      </Spec>
      <Spec id="width-fit" title="Fixed widths against each frame" when={COPY.widthFitWhen}>
        <SpecTable head={["Token", "Value", ...FRAMES.map((f) => String(f.width))]} mono={[0, 1]}
          rows={[
            ["tab-width", <TokenValue name="tab-width" />, ...FRAMES.map((f) => (fit ? `${Math.floor(f.width / fit.tab)} whole tabs` : ""))],
            ...FITS.map((name) => [name, <TokenValue name={name} />, ...FRAMES.map((f) => (fit ? (fit.sizes[name] <= f.width ? "Fits" : "Wider") : ""))]),
          ]} />
        <Prose k="widthFitNote" />
      </Spec>
    </Section>
  );
}

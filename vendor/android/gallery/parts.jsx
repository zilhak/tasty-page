// The shared parts. Each one is the desktop component, imported and unchanged, with the desktop's frozen state grids.
import React, { useState } from "react";
import { Badge, Button, CenterState, Checkbox, Icon, IconButton, Input, ListCtrl, MenuItem, Select, Spinner, StatusDot, Switch, Tab, Table, Tag, Toast, TreeRow } from "../../components/index.js";
import { Cluster, PageStates, Section, Spec, Stage } from "../../gallery/parts/specimen.jsx";
import { COPY } from "./copy.js";
import { Prose, SpecTable } from "./kit.jsx";
import { STATES } from "./states.jsx";

const noop = () => {};
const wide = { width: "var(--tasty-field-width-lg)" };
const items = [{ id: "a", label: "Label", description: "Description", icon: <Icon name="file" /> }, { id: "b", label: "Label", description: "Description", icon: <Icon name="file" /> }];

// Every export of vendor/components, and what the touch section found for it.
const SHORT = "Short of the baseline";
const CATALOG = [
  ["Core", "Button, IconButton", SHORT],
  ["Core", "Badge, Tag, Icon", "Not a target"],
  ["Core", "Kbd", "Needs a keyboard"],
  ["Forms", "Input, Select, SearchableSelect, MultiSelect, AutoComplete", SHORT],
  ["Forms", "CodeArea", "Not measured: its height follows its rows"],
  ["Forms", "Checkbox, Switch", SHORT],
  ["Navigation", "Tab, TreeRow, MenuItem", SHORT],
  ["Navigation", "DrillDown", "Short of the baseline: its back button is an IconButton, small"],
  ["Data", "Table, ListCtrl", SHORT],
  ["Feedback", "Toast, StatusDot, Spinner, LoadingOverlay, CenterState, PendingIndicator", "Not a target"],
  ["Feedback", "NotificationBadge, NotificationItem", "Not measured: which ones the app uses is open"],
  ["Feedback", "Tooltip, HelpHint", "Needs a pointer or keyboard focus"],
];

function LiveSwitch() {
  const [on, set] = useState(false);
  return <Switch label="Label" checked={on} onChange={(e) => set(e.target.checked)} />;
}

export function PartsSection() {
  return (
    <PageStates value={STATES}>
      <Section id="parts" title="Shared parts">
        <Spec id="part-catalog" title="Catalog" when={COPY.partCatalogWhen}>
          <SpecTable head={["Group", "Parts", "Touch"]} rows={CATALOG} />
          <Prose k="partCatalogNote" />
        </Spec>
        <Spec id="part-button" title="Button" when={COPY.partButtonWhen}>
          <Stage>
            <Button variant="primary">Label</Button>
            <Button>Label</Button>
            <Button variant="ghost">Label</Button>
            <Button variant="danger">Label</Button>
            <Button variant="agent">Label</Button>
            <Button disabled>Label</Button>
          </Stage>
        </Spec>
        <Spec id="part-iconbutton" title="IconButton" when={COPY.partIconButtonWhen}>
          <Stage>
            <IconButton aria-label="Add"><Icon name="plus" /></IconButton>
            <IconButton size="sm" aria-label="Add"><Icon name="plus" /></IconButton>
          </Stage>
        </Spec>
        <Spec id="part-input" title="Input" when={COPY.partInputWhen}>
          <Stage><Input value="Value" onChange={noop} style={wide} /><Input placeholder="Hint" style={wide} /></Stage>
        </Spec>
        <Spec id="part-select-check-switch" title="Select, Checkbox, Switch" when={COPY.partSelectWhen}>
          <Stage><Select options={["One", "Two"]} /><Checkbox label="Label" /><LiveSwitch /></Stage>
        </Spec>
        <Spec id="part-tab" title="Tab" when={COPY.partTabWhen}>
          <Stage><div style={{ display: "flex" }}><Tab label="Label" active /><Tab label="Label" /></div></Stage>
        </Spec>
        <Spec id="part-treerow" title="TreeRow" when={COPY.partTreeRowWhen}>
          <Stage><div style={wide}><TreeRow label="Label" expandable open /><TreeRow label="Label" icon={<Icon name="file" />} /></div></Stage>
        </Spec>
        <Spec id="part-menuitem" title="MenuItem" when={COPY.partMenuItemWhen}>
          <Stage><div style={wide}><MenuItem label="Label" icon={<Icon name="plus" />} /><MenuItem label="Label" danger /></div></Stage>
        </Spec>
        <Spec id="part-listctrl" title="ListCtrl" when={COPY.partListCtrlWhen}>
          <Stage><div style={wide}><ListCtrl items={items} onSelect={noop} /></div></Stage>
        </Spec>
        <Spec id="part-table" title="Table" when={COPY.partTableWhen}>
          <Stage><div style={wide}><Table columns={[{ key: "a", header: "Name" }]} rows={[{ a: "Cell" }, { a: "Second" }]} rowKey="a" onRowClick={noop} /></div></Stage>
        </Spec>
        <Spec id="part-badge-tag" title="Badge, Tag" when={COPY.partBadgeWhen}>
          <Stage><Cluster><Badge variant="primary">3</Badge><Badge variant="danger">3</Badge><Tag>Label</Tag><Tag variant="success">Label</Tag></Cluster></Stage>
        </Spec>
        <Spec id="part-feedback" title="Toast, StatusDot, Spinner, CenterState" when={COPY.partFeedbackWhen}>
          <Stage>
            <Toast variant="success" icon={<Icon name="check" />}>Label</Toast>
            <StatusDot status="running" />
            <Spinner />
            <CenterState natural title="Label" sub="Description" />
          </Stage>
        </Spec>
      </Section>
    </PageStates>
  );
}

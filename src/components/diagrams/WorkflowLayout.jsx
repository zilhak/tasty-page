import React from "react";
import { TabStrip, TerminalPane } from "../../../vendor/ui_kits/terminal/work.jsx";

const noop = () => {};

/** A static composition of the design kit, not a running terminal. `copy` is the `diagrams` part of a language dictionary. */
export function WorkflowLayout({ copy, background = false, caption: captionOverride }) {
  const labels = background ? copy.background.labels : copy.workflow.labels;
  const lines = background
    ? copy.background.lines
    : [["project / src", "git status"], ["project / tests", copy.workflow.testCommand]];
  return <figure className="workflow-diagram">
    <div className="workflow-diagram__grid" aria-hidden="true" inert="">
      {labels.map((label, i) => <div className="workflow-diagram__pane" key={label}>
        <TabStrip tabs={[{ id: "terminal", title: label, kind: "terminal", owner: "user", activity: "idle" }]}
          active="terminal" onSelect={noop} onClose={noop} onNew={noop} onSearch={noop} />
        <TerminalPane session={{ id: String(i + 1), lines: lines[i] }} focused={false} />
      </div>)}
    </div>
    <figcaption>{captionOverride ?? `${labels.join(" / ")} — ${copy.workflow.caption}`}</figcaption>
  </figure>;
}

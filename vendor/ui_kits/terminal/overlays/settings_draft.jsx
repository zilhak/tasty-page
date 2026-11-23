import React from "react";

// Tasty UI kit — the settings window's draft.
// ─────────────────────────────────────────────────────────────────────────
// The app edits a copy of the saved settings while the window is open: Save writes the copy, Cancel and the
// Linux title bar close drop it (docs/features/settings/screens/settings.md in the Tasty repository). The kit
// mirrors that with one store per SettingsWindow:
// · useDraft(key, initial, commit) has the shape of React.useState. Inside a SettingsWindow the value lives in
//   the window's draft under key, so it survives a tab switch and a re-render. Outside one (a gallery specimen
//   that renders a pane on its own) it is plain component state, as before.
// · The window starts its draft from its saved prop and hands the draft to onSave(values) on Save. A host that
//   keeps those values and passes them back as saved opens the window on what was saved last.
// · commit(value, get) turns a draft value into what Save writes, for a pane that marks unsaved rows
//   (pending add / remove): Save applies the marks. get(otherKey) reads another key's current value.
// A key not touched since the window opened is not in the draft, so the pane's own initial value shows, which
// is the kit's first value: the saved one until the first Save.

const DraftContext = React.createContext(null);

const resolve = (initial) => (typeof initial === "function" ? initial() : initial);
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

function useDraft(key, initial, commit) {
  const ctx = React.useContext(DraftContext);
  const [own, setOwn] = React.useState(initial);
  // The initial value belongs to the key: a component React reuses at the same place for another field
  // (a row of another subtab) starts from that field's initial value, not the one it was first given.
  const first = React.useRef(undefined);
  if (first.current === undefined || first.current.key !== key) first.current = { key, value: resolve(initial) };
  const set = React.useCallback((next) => {
    if (ctx) ctx.set(key, next, first.current.value);
    else setOwn(next);
  }, [ctx, key]);
  if (!ctx) return [own, setOwn];
  ctx.register(key, first.current.value, commit);
  return [has(ctx.values, key) ? ctx.values[key] : first.current.value, set];
}

// The window's store. saved: the values the window opens on. Returns the context value and save(), which
// applies every registered commit and returns the values for onSave.
function useDraftStore(saved) {
  const [values, setValues] = React.useState(() => ({ ...(saved || {}) }));
  const reg = React.useRef({});
  const valuesRef = React.useRef(values);
  valuesRef.current = values;
  const ctx = React.useMemo(() => ({
    values,
    set: (key, next, initial) => setValues((v) => {
      const prev = has(v, key) ? v[key] : initial;
      return { ...v, [key]: typeof next === "function" ? next(prev) : next };
    }),
    register: (key, initial, commit) => { reg.current[key] = { initial, commit }; },
  }), [values]);
  const save = React.useCallback(() => {
    const v = valuesRef.current;
    const get = (k) => (has(v, k) ? v[k] : reg.current[k] ? reg.current[k].initial : undefined);
    const out = { ...v };
    for (const [k, r] of Object.entries(reg.current)) {
      if (r.commit) out[k] = r.commit(get(k), get);
    }
    return out;
  }, []);
  return [ctx, save];
}

export { DraftContext, useDraft, useDraftStore };

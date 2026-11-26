<!-- source-hash: 308387cf9570 -->
# Lua scripts

Lua scripts registered in Tasty can run from a keybinding or be set to run automatically when a window, workspace, or tab opens or closes.

Register each script and connect it to a shortcut or event. Unregistered files do not run automatically at startup.

## Registering

Press **Add script** in **Settings** > **Misc** > **Scripts**.

- **File** — The path to a `.lua` file. You can also pick it with **Browse…**. You may put it anywhere, but the convention is `~/.tasty/scripts/`.
- **Display name** — The name shown in the list and in the keybinding screen. Leave it empty and the file name is used.

Registering adds one row to the list, showing the keybinding attached to it. If there is none yet it says **Unbound**. You can rename or remove the script from the row. Removing it also releases the keybinding attached to it.

## Running from a keybinding

Assign a combination for each registered script in **Settings** > **Keybindings** > **Run Scripts**. Press the combination you assigned and the script runs right there.

## Auto-running on an event

Pick an event with **Add trigger…** on the **Auto-run** line below the script's row. You can attach several, and each attached event shows as a chip that you click to detach. Once every event is attached, **Add trigger…** stays in place, disabled.

| Event | When |
|---|---|
| `tasty.startup.post` | Right after Tasty has finished coming up |
| `window.create.post` · `window.delete.post` | When a window is created or closed |
| `workspace.create.post` · `workspace.delete.post` | When a Workspace is created or closed |
| `workspace.change.post` | When a Workspace name or description is changed directly in the window |
| `tab.create.post` · `tab.delete.post` | When a Tab is created or closed |
| `tab.change.post` | When a Tab name is changed directly in the window |
| `pane.create.post` · `pane.delete.post` | When a Pane is created or closed |
| `surface.create.post` · `surface.delete.post` | When a Surface is created or closed |

The two rename events fire **only when the change was made directly in the window**. A name changed through the CLI does not fire them.

An auto-run script that causes another event through the CLI can start a chain. To prevent repeated execution, Tasty briefly holds off new automatic runs while a script runs and just after it finishes.

## What a script can do

Use the following Tasty functions in your scripts.

| Function | What it does |
|---|---|
| `tasty.tree()` | Returns a copy of the Workspace · Pane · Tab · Surface structure as a Lua table. The top level is a Workspace array, with no separate window level |
| `tasty.run_cli(args)` | Runs a `tasty` command. Pass a single string or a table of strings |
| `tasty.log(msg)` · `tasty.warn(msg)` | Writes to the log |
| `tasty.on(event, cb)` | Registers a function to be called when an event fires. It can run follow-up work, but cannot cancel or alter an event that has already happened |

Actually operating Tasty is mostly done with `tasty.run_cli`. Whether you create a Workspace or send a notification, anything you can do with the [CLI](../agents/cli.md) works here too.

```lua
-- Log the Workspace count and send a notification.
local tree = tasty.tree()
tasty.log("workspaces: " .. tostring(#tree))
tasty.run_cli({ "notify", "New Workspace", "--title", "script" })
```

File I/O and running external commands from the Lua standard library are available as they are. Scripts run on your computer without a separate sandbox.

### `tasty.tree()` return structure

`tasty.tree()` returns a copy of the most recently prepared tree at the time of the call. Changing the returned table does not change Tasty. `tasty.run_cli` requests execution without waiting for completion, so a `tasty.tree()` call immediately after it may not include the result.

Workspaces are appended to the array by window. Workspaces from open windows, including hidden or minimized windows, come first, with no fixed order between windows. Workspaces from windows sent to the background with Tasty’s **Minimize** on macOS follow in the order the windows were sent to the background. The order among windows sent to the background together in one operation is not fixed.

| Level | Fields |
|---|---|
| Workspace | `id`, `name`, `active` (the selected Workspace in that window, including windows sent to the background), `busy_count` (the number of busy Surfaces in the Workspace), `panes` |
| Pane | `id`, `focused` (the focused Pane in that Workspace), `busy_count` (the number of busy Surfaces across all Tabs in the Pane, including unselected Tabs), `tabs` |
| Tab | `id`, `name`, `active` (the selected Tab in that Pane), `busy_count` (the number of busy Surfaces in the Tab), `busy` (true when any Surface in the Tab is busy), `surface` |
| `tab.surface` (split Tab) | `type = "SplitLayout"`, `focused_surface` (the focused Surface id in that Tab), `surfaces` (an array of Surface ids in the Tab), `layout`. There is no `busy` field |
| `layout` node | `Leaf`: `type`, `id`, `kind`, `busy`. `Split`: `type`, `direction` (`horizontal` · `vertical`), `ratio`, `focus_second`, `first`, `second`. `Split` has no `busy` field |
| `tab.surface` (unsplit Tab) | A single Surface. Every Surface has `id`, `type`, and `busy`; the other fields depend on its type. A terminal has `type = "Terminal"`; `cols` and `rows` are always 0 in this tree |

`focus_second` is set when a split is created or restored and may differ from the current focus. Use `focused_surface` to determine the current focus.

### Finding the focused Surface

Find the focused Surface id within one window in this order. Windows sent to the background are included.

1. Find the Workspace whose `active` is true.
2. Within it, find the Pane whose `focused` is true.
3. Within it, find the Tab whose `active` is true.
4. Read `tab.surface.focused_surface` if `tab.surface.type` is `"SplitLayout"`, or `tab.surface.id` otherwise.

```lua
local function focused_surface_id()
  for _, ws in ipairs(tasty.tree()) do
    if ws.active then
      for _, pane in ipairs(ws.panes) do
        if pane.focused then
          for _, tab in ipairs(pane.tabs) do
            if tab.active then
              local s = tab.surface
              return s.type == "SplitLayout" and s.focused_surface or s.id
            end
          end
        end
      end
    end
  end
end
```

### What the tree cannot distinguish

`active` and `focused` are determined per window, including windows sent to the background. With multiple windows, each has a Workspace whose `active` is true. The tree has no field identifying the window, so it cannot distinguish the window with OS focus or the windows visible on screen. Selecting the first `active` Workspace, as in the example above, may return a Surface from another window. When Tasty is sent to the background with **Minimize**, it may return a Surface from a window that is not on screen.

## When the file changes

The file's hash is recorded at registration time and compared against the current file on every run. Edit the script in an editor and a **changed** badge appears in the list.

- **Running from a keybinding** — A confirmation dialog appears. Approve it and the new contents run and the hash is updated. The updated hash applies to every window, so running it from another window does not ask again.
- **Auto-run** — It is blocked and does not run, and a warning notification is added to the notification list. This is to stop a script that changed while nobody was looking from running. Check the badge in the list and run it by hand once to approve it, and it runs again.

Other files pulled in with `require` are not checked.

## Execution limits

- There is a memory ceiling, and going over it aborts just that run.
- Tasty checks a time limit while executing Lua instructions and stops infinite loops. It may not interrupt a script immediately while it waits for file I/O or an external command. The app’s screen runs separately.
- Only text source is accepted. Precompiled bytecode is rejected.
- The debug library and the arbitrary-code-loading functions are blocked.

## When something goes wrong

- **Scripts run from a shortcut** — If the script could not run or failed, a failure toast appears in the window where you pressed the shortcut. This covers a missing registration, a file that could not be read, an error raised by the script, going over the time limit, and a full run queue. If you closed that window before the result arrived, the toast does not appear in another window.
- **Auto-run** — A warning notification is added to the notification list when a script was blocked because its file changed, failed to read or run, or was skipped to stop a chain. No popup appears. The same notification is recorded only once within 10 seconds.

Nothing is shown for a successful run. To see the details, raise the log level.

```sh
TASTY_LOG=tasty_lua=debug tasty
```

<a id="what-to-read-next"></a>

## Keep exploring

- [Keybindings](keybindings.md) — Assigning combinations and presets
- [Settings](settings.md) — The whole settings window and where the settings file lives
- [Driving Tasty from the CLI](../agents/cli.md) — The commands you can call with `tasty.run_cli`

Scripts launched by a shortcut are read in the background. If the contents have changed since registration, the existing confirmation dialog asks for approval before execution. Script files can be up to 8 MiB.

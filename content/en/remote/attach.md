<!-- source-hash: 0954b9216551 -->
<a id="remote-attach"></a>

# Working remotely (attach)

Tasty’s remote attach uses SSH to display and control a workspace from Tasty running on another computer. The remote workspace displayed locally is called a mirror. While connected, the mirror holds the workspace; users on the remote side can view it but cannot type into it.

## Concepts

- attach brings in and shows a Workspace from a **remote Tasty that is already running**. It does not open a new remote shell. Tasty must be running on the remote machine (either the GUI or a windowless [headless build](../getting-started/install.md#headless-build)).
- The remote Workspace is held **exclusively** by the side that mirrors it. Meanwhile the user on the remote side can see that terminal but cannot type into it (read-only). It comes back when the connection is closed.
- Mirror workspaces have a sky-blue **Remote** marker in the sidebar. Rows attached through the **Add remote workspace** dialog are saved and return to the same place after restart. Mirrors attached through the CLI are not saved.
- The remote Tasty does not need to be on PATH. It is enough that the port file (`~/.tasty/tasty.port`) can be read.

## 1. Create a profile

There are two kinds of profile. Both are stored in `~/.tasty/remote-profiles.toml`.

| Kind | Holds | Used for |
|---|---|---|
| `ssh` | **Connection details only** — host · user · port · identity | `tasty tool ssh` connections; referenced by attach profiles |
| `tasty-attach` | Attach connection settings (a reference to an ssh profile, or entered directly) plus the remote tasty path · port discovery mode | attach and remote queries use **only this kind** |

Trying to attach directly with an `ssh` profile is refused. Always create one `tasty-attach` profile.

### From the GUI

1. The tools button in the sidebar → **Tools** menu → **Remote connections…**.
2. **Remote profiles** tab → **Add profile**. Enter the name · host · user · port · shell and save. If you leave the shell as `auto`, saving connects once over SSH to detect the shell.
   - Hosts already in `~/.ssh/config` can be created directly from the **From ssh config** section below the profile list with **Add profile** on the right of the host. Only the alias is stored, so changes to the ssh config are followed as they are. A host you already created shows **in profiles** instead of the button. The list is read once when the popup opens, so after editing the ssh config, reopen the popup.
   - Register key files in the **Passkey** tab first, then pick them from the profile's Passkey dropdown. Secret values are referenced only by path in `~/.tasty/passkeys.toml`.
3. **Attach** tab → **Add attach**. Enter a name and, under **Connection**, choose **SSH profile** (referencing the one created above) or **Direct (inline)**.
   - **REMOTE TASTY** group: **Executable** (the remote tasty path, default `tasty`) · **Port mode** · **Port file**. If tasty is not on the remote PATH, enter the full path in Executable or set the port mode to `file-unix`.

The Save button is temporarily disabled while saving. If saving fails, your input and the error stay visible so you can edit and retry. Canceling or closing the remote connections popup leaves an already accepted save running; its later completion does not overwrite a reopened form. A new Passkey with an existing name is rejected without replacing the existing credential.

When editing a Passkey, typing and then clearing the value prevents a delayed preload from filling it again. Canceling and reopening the editor accepts only the new edit’s preload. If the credential cannot be loaded, the current editor shows an error.

### From the CLI

CLI profile and Passkey mutations apply their changes to the latest list under a file lock. Corrupt or unreadable lists are preserved. SSH detection for `add-ssh` starts after the save succeeds and cannot overwrite a profile changed by another command during detection.

An inline Passkey file, the credential list and a profile reference are saved in that order, without a transaction across files. If an error reports that an earlier stage was saved, check the list and reference state. Removing a list entry may succeed even if cleanup of its managed file fails. User files registered as `path` are never deleted. Windows inline storage requires PowerShell ACL setup and verification; failure prevents the secret payload from being written.

If setting file access permissions (ACLs) fails, the error message includes the cause.


```sh
# ssh profile
tasty tool remote-profile add-ssh --name host --host 10.0.0.5 --user me --port 22 --identity ~/.ssh/id_ed25519
tasty tool remote-profile add-ssh --name win --host 10.0.0.9 --shell powershell --label "Windows build PC"   # set the shell and display name
tasty tool remote-profile list-local                      # list ~/.ssh/config aliases
tasty tool remote-profile import --from devbox --name devbox   # alias → ssh profile

# tasty-attach profile (references the ssh profile)
tasty tool remote-profile add-attach --name host-attach --ssh-ref host \
  --remote-tasty /home/me/tasty/target/release/tasty --port-mode auto

# inspect · edit · remove
tasty tool remote-profile list [--kind ssh|tasty-attach]
tasty tool remote-profile show --name host-attach
tasty tool remote-profile edit --name host-attach --port-mode file-unix
tasty tool remote-profile detect --name host-attach       # actually connect to the remote and verify the port
tasty tool remote-profile remove --name host-attach
```

Port modes:

| Value | Behavior |
|---|---|
| `auto` (default) | Tries `subcommand` → `file-unix` → `file-windows` in that order |
| `subcommand` | Runs `<executable> port` on the remote to obtain the port |
| `file-unix` | Reads `~/.tasty/tasty.port` on the remote (no tasty execution) |
| `file-windows` | Reads the port file of a Windows remote |

If you pass `--port-file <path>`, that file is read with the highest priority.

To read the IPC port of the instance currently running on the remote machine, run `tasty port` on that machine — this is what port mode `subcommand` calls on the remote.

<a id="2-check-that-the-remote-is-alive"></a>

## 2. Check the remote connection

```sh
tasty remote check --profile host-attach       # alive: host (port 41234, version …, N workspaces)
tasty remote workspaces --profile host-attach  # list of remote Workspaces (id · name · whether occupied)
```

`remote check` only reports alive once it has found the port and actually received a response. If the program has stopped but its port file remains, the result is `dead`. The failure cause is reported as one of four kinds: SSH connection failure / remote instance not running / response could not be parsed / timeout.

If the remote port is found but nothing is listening on it, `tasty remote check` and the remote workspace list report that condition. Check that Tasty is running on the remote computer on the reported port. With automatic discovery over SSH, if the remote `tasty port` exits with code 3, Tasty reports that the remote instance has stopped and skips file-based port discovery.

Connection attempts do not wait forever — 10 seconds for the SSH connection, 20 seconds per step, 45 seconds total. On a slow link, raise it yourself with something like `--option ConnectTimeout=30` on the ssh profile.

## 3. Attach from the GUI

1. In the sidebar, **right-click the New workspace (+) button** or right-click the empty background → **Add remote workspace**. (If categories are on, it is also in the category header's right-click menu.)
2. Pick a profile under **Attach profiles** on the left. The list of remote Workspaces appears on the right (if there is no response within 20 seconds it stops and shows **Retry**).
3. Pick a Workspace and **Connect**. One that someone else is already attached to is shown as **in use** and cannot be picked.
   - Picking the first row, **New workspace**, creates a Workspace on the remote with a default name and then attaches to it (**Create & connect**). A Workspace created this way stays on the remote.
   - **Create & connect** checks the selected Surface in the window that opened the popup. Even while the popup has keyboard focus, the selected Surface can supply its remote working directory if it is a mirror terminal using the same attach profile. This applies when local `general.inherit_cwd` is on and the remote Tasty supports this behavior. With inheritance on and no matching mirror terminal selected, the remote Tasty uses its own defaults. Turning inheritance off locally disables it on remote versions that support this behavior.
   - Once the list appears, move between rows with `↑` / `↓` and press `Enter` to connect.
4. A mirror Workspace with the **Remote** tag appears in the sidebar and focus moves to it. If connecting or preparing the mirror fails, a failure toast with the reason appears in that window. Nothing is shown if you have closed the window.
   - If the remote force detach is already confirmed when Tasty checks whether the new connection is ready, no row is created. The toast reads **Couldn&apos;t connect to the remote workspace.** followed by **force-detached by server** in parentheses. If the force detach is confirmed after that check, the connection can succeed and then drop shortly afterward.

A remote workspace that is itself a mirror from another Tasty is disabled with a `mirror` marker and cannot be attached. `tasty remote workspaces` also prints a note beneath that row.

## 4. Attach from the CLI

```sh
tasty tool attach --list                                   # list tasty-attach profiles
tasty tool attach host-attach --workspace 3                # mirror the whole Workspace (run in a terminal)
tasty tool attach host-attach 57                           # a single Surface only
tasty tool attach host-attach 57 --raw                     # wire my terminal directly to the remote Surface (exit with Ctrl+\)
tasty remote attach --profile host-attach --workspace 3    # long form of the same thing as tool attach
tasty remote attach --ssh me@10.0.0.5 --workspace 3        # one-off, without a profile
tasty remote new-workspace --profile host-attach --name build --cwd /home/me/proj   # create a Workspace on the remote
```

### Attach to a running Tasty window

The running Tasty opens the SSH tunnel itself and adds the remote workspace to this window as a mirror, without moving focus. To attach an existing workspace, give its remote ID with `--workspace`. Use a `tasty-attach` profile name with `--profile`, or use `--ssh <target>` instead to connect without a profile.

```sh
tasty remote attach --into-gui --workspace 3 --profile host-attach
tasty remote attach --into-gui --workspace 3 --ssh me@10.0.0.5
```

When attaching an existing workspace, the command prints the acknowledgement as one JSON line, waits up to 90 seconds for the connection result, then prints that result as a second JSON line. It exits with code 1 if the connection fails or no result arrives within 90 seconds. An acknowledgement alone does not mean the connection succeeded.

If the remote force-detaches you while connecting, see the [connection result](#5-connect-a-saved-remote-row).

To create a remote workspace and immediately attach it as a mirror, use `--new-workspace` instead of `--workspace`. `--name` and `--cwd` are optional; `--cwd` is a path on the remote computer. This form prints the creation result as one JSON line. It does not wait for a second result line as the existing-workspace form does. Check `tasty list workspaces` for a row marked `[mirror]` to confirm that the mirror appeared.

```sh
tasty remote attach --into-gui --new-workspace --profile host-attach --name build --cwd /srv/project
tasty list workspaces
```

`tasty remote new-workspace` creates a remote workspace. To also attach it as a mirror in the local GUI, use `tasty remote attach --into-gui --new-workspace`. The end of the `remote new-workspace` help text points to this command too.

The existing `--target-port` form still attaches through a local port you have already forwarded. Prepare the tunnel yourself for this form.

```sh
tasty remote attach --into-gui --target-port 5555 --workspace 3
```

If the same profile and remote workspace already belong to a saved remote row, this connects that row instead of creating another mirror. If you disconnected the row yourself or a force detach is blocking it, `tasty remote attach --into-gui` cannot reconnect it. First run `tasty remote connect --workspace <local id>` or choose connect from the row menu.

An agent using a session token can run `tasty remote attach --into-gui`, `tasty remote connect`, `tasty remote disconnect`, and `tasty remote refusals` without an additional permission. However, `tasty list workspaces`, used to check the mirror, requires `surface.read`.

Common options:

| Option | Used with | Effect |
|---|---|---|
| `--send <input>` | `tool attach`, `remote attach` | Sends input once right after attaching (escapes `\n` `\r` `\t` `\xNN` are decoded) |
| `--send-to <surface>` | `tool attach`, `remote attach` | In a Workspace attach, the remote Surface ID that receives `--send` |
| `--dump-after <ms>` | `tool attach`, `remote attach` | Collects output for the given time, prints the mirrored screen and exits (for checks without a GUI) |
| `--remote-tasty <path>` | `remote attach·check·workspaces·new-workspace` | Path to the remote tasty binary when you don't use a profile (default `tasty`). With `--profile`, the profile's value is used |
| `--remote-port-mode <mode>` | Same as above | Port discovery mode (`auto`, `subcommand`, `file-unix`, `file-windows`) |
| `--json` | `remote workspaces`, `remote new-workspace` | Prints the result as JSON |

- A Workspace attach mirrors the terminals inside it, including the split structure.
- Surfaces that a plugin draws itself, such as Image Surfaces, show their content as well, and clicks and key presses reach the remote. This includes Surfaces from plugins you installed yourself.
- In the explorer you can change files on the remote computer (since 0.12.2). New folder, new file, rename, move to trash, and copy, cut, paste and drag-and-drop within the same connection are carried out by the remote Tasty, and the progress display, name-conflict popup and result card are the same as in a local explorer. The remote Tasty must also be 0.12.2 or later. The following limits apply.
  - **Undo** and **Redo** are disabled in the empty-space menu. Remote operations are not recorded in the undo history. To revert one, use **Undo** on its result card.
  - Pasting and drag-and-drop are unavailable between local and remote, or between separate remote connections. The paste item stays visible and disabled.
  - When remote file changes are unavailable, their menu items and toolbar buttons are disabled. The reason asks you to update Tasty if the remote version is out of date. On Linux and macOS, hover over a disabled menu item to see its reason when one is available. Right-click menus on Windows have no tooltips. The paste shortcut shows the same reason in a notification.
  - **Open in system**, the item for showing a file in the OS file manager, and **Open in New Tab** are disabled in their respective menus. Choosing **Add to Favorites** shows a notice that the action is not supported yet. See the [Explorer right-click menu](../using/files.md#right-click-menu) for individual items.
  - When you create a new folder or file or rename an item on the remote, the name you typed stays in place, greyed, with a spinner next to it until the remote answers. You can't edit or cancel it meanwhile. On success the new item is selected or the rename popup closes; on failure you can edit the same name again.
  - If the connection drops during an operation, the remote stops at the item it was on. The explorer on this side keeps a warning card saying the result is unknown until you close it, and reads the folder again once the connection is back. The card has no Retry or Undo button.
- In the explorer, double-clicking a markdown file opens a markdown tab for it on the remote computer, and the tab appears in this window too; a file at the same path on this computer is not read. If the type's default handler can't be used remotely, only the handlers that can are offered. If no handler on the remote can open the file, a **Download and run** dialog opens within the requesting surface. Requesting it again from another surface while it is open closes the existing popup and reopens it within the new surface. After **Download and run** finishes downloading, Tasty opens the file according to your local handler settings. If the handler opens a Tasty tab, it always opens in a new local workspace, even if you switch to another local workspace during the download.
- Markdown Surfaces show the remote document in this computer's theme, and the **Reload** button left of the address bar fetches the latest content again. When the document changes on the remote, the content isn't replaced on its own — the Reload button fills with the accent color instead (if the remote Tasty is a headless build, the color doesn't change, so press it yourself to check). While the connection is lost and waiting to reconnect, the document shows a notice that the connection was lost instead of the old content, the address bar and its buttons are all disabled, and the buttons say **Disconnected from the remote**. Once it reconnects it fetches the latest content on its own. Relative image paths and file links inside a remote document don't open.
- Type a path on the remote computer into a remote Markdown address bar and press `Enter` or **Go** to switch the same Surface to that remote file. This computer's recent files don't appear in the autocompletion. `Esc` puts the current document's remote path back. If it can't be opened, the path you typed stays and the reason appears under the address bar. If the file doesn't exist on the remote, it says **Can't open … on the remote: file not found.**; if the remote refuses for another reason, the remote's own reason is shown as sent, in English. If the connection is lost before the remote answers, it says **Connection lost before the remote answered. Reconnect and try again.** — whether the remote changed anything is unknown then, so check after reconnecting. If there's no answer after 30 seconds, **Still waiting for the remote…** appears under the address bar, and a late answer from the remote still applies. Typing again or pressing `Esc` clears these lines, and a failure that arrives after that doesn't bring them back. If the file opens late, the document still switches to it.
- The folder button left of a remote Markdown address bar (**Open a remote file…**) opens the file chooser in the remote document's folder on the remote computer. The remote file you pick opens in the same Surface, and if the remote can't open it, a toast tells you.
- While you're viewing a mirror, when the **Open Markdown File** popup converts a Surface to markdown or opens a new tab, the path you type in the popup or pick with **Browse…** opens as a file on the remote computer. A relative path is taken from the remote terminal's current folder. A file opened this way is not added to this computer's recent files list.
- On Linux, Windows, and macOS, you can view the body of a remote HTML file. Choose **Allow** or **Decline** before receiving a large file. Scripts follow your local HTML settings; allowing scripts displays the body already received. The address is read-only, and **Reload** receives the latest body. A completed body remains visible after disconnection, with Reload disabled. Connections to older versions may still show an empty area. If the remote version also supports it, referenced files such as CSS and images under the same folder are received too. Large files are presented one at a time. At the 2MB document limit, choose **Continue** or **Stop**. Large-file and document questions do not disappear however long you wait. If the remote transfer expired in the meantime, **Allow** or **Continue** requests that file again, and asks once more if its size has changed. Continue also receives the remaining files; Reload also retries failed files. The count of declined or failed files remains until Reload. Moving to a child HTML file checks it as a new document. When the page cancels a file request, its receive wait ends while other requests for the same file remain active. On Linux X11 (including XWayland in Wayland sessions where `DISPLAY` is set and the X server is reachable), Windows, and macOS 27 or later, HTTP and HTTPS addresses also open when both versions support them. Requests run on the remote computer, so submitting a form or using a page button can change the remote service. On Windows and macOS, however, WebRTC connections from a page whose scripts are allowed can leave this computer directly. Tasty removes the page's WebRTC features to reduce this but does not guarantee that every path is closed. Same-origin requests are allowed by default; requests to other origins follow your local HTML remote-content setting. Browser security policies still apply. Existing receive consent applies at 100000 encoded bytes per response and 2000000 encoded bytes per document. Allowing scripts reuses the received body without resubmitting a form. An explicit Reload sends the original request again and keeps that document’s native cookies. Disconnection stops scripts; reconnecting or replacing the remote source does not copy cookies or script permission. If private browser storage preparation briefly overlaps, it waits for a bounded time; storage limits and safety-check failures still appear as errors. On macOS, a remote address such as `localhost` or `127.0.0.1` opens under a separate name such as `localhost.tasty.localhost`. The address bar shows the original address, but page scripts read the separate name, and images or requests inside the document that name the remote `localhost` with a full address do not load. Relative paths and following links still work. Native Wayland on Linux, used when `DISPLAY` is unset or the X server cannot be reached, and macOS 11–26 do not support remote web-address rendering and do not connect from this computer as a fallback. If remote HTML files or web addresses cannot be viewed on Linux, see [native Wayland troubleshooting](../help/troubleshooting.md#linux-native-wayland) and [GTK initialization and tray troubleshooting](../help/troubleshooting.md#linux-gdk-backend). The minimum supported macOS version remains 11.
- `--raw` works only at the Surface level.
- When you run `tasty remote attach` in a terminal, it tries to reconnect if SSH drops unless you pass `--no-reconnect`. If it receives a force-detach notice from the remote, it exits without reconnecting.
- If a slow link makes you miss part of the screen the remote was sending, the remote says so and the attach re-attaches on its own to fetch the screen again, printing a one-line notice in your terminal. An attach that prints the screen and exits re-attaches up to three times per run; if it still misses something, it prints the result and then warns that part of the screen may be missing. `--raw` re-attaches with no limit and redraws the screen from scratch. Input given with `--send` is not sent again.

To attach directly to a running Tasty window from the CLI, use `--into-gui` above. For connections that remain after restart, see saved remote rows below.

<a id="5-set-up-automatic-attach-on-a-workspace"></a>

## 5. Connect a saved remote row

A workspace attached through the **Add remote workspace** dialog saves its connection details and the row's name, category, and position. It returns to the same place after a restart and tries to connect as soon as it becomes visible. This includes the restored active row after restart, switching window focus, and selecting a row. Rows you disconnected yourself, rows closed elsewhere, and rows blocked from connecting automatically by a force detach are excluded. Mirrors attached through the CLI are not saved and are removed when disconnected.

A saved row whose connection drops retries for **Keep reconnecting for**, then stays in the list as disconnected. The default is 300 seconds, with a range of 0–3600. At 0, it becomes disconnected immediately without automatic retries. A connection popup and card and status indicators report reconnecting, success, and timeout instead of toasts. Retries stop immediately with a reason if another client holds the workspace, the remote workspace is gone, or the target is itself a mirror. If the first connection fails, the row keeps the reason and does not retry automatically until you return to it or request a connection.

If the connection breaks because Tasty could not send data or the mirror could not apply a remote screen update, Tasty immediately stops sending data and shows **reconnecting**. It starts trying to reconnect once it confirms that the old connection has ended. The delay is usually very short. If the server stops responding, it can be about twice the time Tasty waits before disconnecting an unresponsive connection.

A row you disconnected shows **Disconnected** and “You disconnected this workspace. It stays disconnected until you reconnect.” in its popup. Switching away and back does not connect it. Choose connect or reconnect from its popup or row menu, or select the same row in the **Add remote workspace** dialog. An agent can explicitly connect it with:

```sh
tasty list workspaces
tasty remote connect --workspace 7
```

`--workspace` is required and takes the saved remote row's **local ID**. In this example, `7` is the row's ID from `tasty list workspaces`, not the remote ID. Connecting does not move focus. The command prints an accepted reply as one JSON line, then the final result as a second JSON line. An already connected row succeeds immediately; a connecting row joins that attempt. It exits with code 1 if the result fails or does not arrive within 90 seconds. It fails immediately for a normal local workspace, an unsaved CLI mirror, a nonexistent ID, a remote workspace that is gone, or a row whose window is closed.

If the remote force detach is already confirmed when Tasty checks whether the connection is ready, the connection fails. This applies to `tasty remote connect` and to `tasty remote attach --into-gui` with a profile or SSH target when connecting to an existing remote workspace. The final result has `state` set to `failed` with the message `the remote workspace was force-detached before the connection was installed`. Requests that joined the connection attempt for the same row receive the same result.

If the connection request has no saved row, this failure leaves no force-detach record. If the force detach is confirmed after Tasty checks that the connection is ready, the result can report success and the connection can then drop.

Requests that target an unconnected saved row by workspace, such as `tasty claude spawn --workspace`, start connecting and wait up to 35 seconds. After restart, a row that has not connected yet has no panes, tabs, or surfaces, so only requests that accept a workspace argument can target it. Commands targeting a surface, such as `tasty send` and `tasty read screen`, can only use a row that connected during this run and still has surfaces. Once connected, the request runs; otherwise it ends with an error explaining the failure or refusal.

If a saved row needs a new connection because it has yet to connect or its connection has dropped, these requests return a disconnected error when the row was disconnected manually or a force detach blocks it from connecting automatically. A request can still use a live connection. To connect a blocked row manually, run `tasty remote connect --workspace <id>` or choose connect from the row menu. Running `tasty remote attach --into-gui` for the same remote target does not clear either block.

Listing with `tasty list workspaces`, `tasty remote workspaces`, or `tasty remote refusals` does not connect rows. The regular output of `tasty list workspaces` includes a `[mirror]` marker but does not display connection state; use the GUI popup and card to see a saved row's connection state.

A row whose remote workspace was closed elsewhere stays in the list, but selecting it does not connect it and its reconnect button is disabled. After restarting Tasty, it returns to an unconnected row and you can request a connection again.

### Force-detached rows

A saved remote row stays disconnected after it receives a force-detach notice from the remote. Reopening the row, bringing it into view, or restarting Tasty does not connect it automatically. To connect it yourself, use the Connect button, choose connect from the row menu, run `tasty remote connect`, or select the same row in the **Add remote workspace** dialog. Once a manual connection clears the force-detach record, later interruptions trigger automatic reconnects as usual. If the connection drops before the notice arrives, Tasty may reconnect as it would after any other interruption.

If several saved rows point to the same remote workspace through the same profile, force-detaching one row also stops the others from connecting automatically. Connecting one row yourself clears the record, but the other rows remain blocked during the current run. Connect each of the other rows separately. On restart, the block carries over only for targets that still have a force-detach record. Closing the last saved row for that workspace and profile locally clears both the record and the block for the current run.

Older versions of the remote Tasty also report a force detach when the connection ends because the workspace was closed. A row that receives that notice stays disconnected even after a restart. In rare cases, the remote may confirm that it closed the workspace and send a force-detach notice at the same time. The row you asked to close closes, but other saved rows for the same remote workspace and profile can stop connecting automatically and stay force-detached. Connect an affected row yourself to clear the block for that row.

## What you can do inside a mirror

- Keyboard input · mouse go straight to the remote terminal. The remote re-lays out to match the size of your Pane.
- If the remote does not answer a new size, Tasty asks once more. If there is still no answer (about 10 seconds), a banner saying **Couldn't sync the terminal size with the remote** appears at the top of the Workspace with the affected tab names. When several tabs share a name, as split tabs do, the name appears once with a count, such as `Shell ×2`. **Retry** (**Retry all** for several) asks again, and × only closes the banner. If the remote accepts that size later, the banner goes away on its own. A remote running an older Tasty without this feature never shows the banner.
- Splits, new Tabs, closing · reordering Tabs, Surface conversion, and reopening a closed item are **executed on the remote** and the result is reflected in the mirror. Creating a Surface of a type the remote does not have fails with a toast. When an agent requests a split, new Tab, close, move, or conversion (including a markdown navigation or an image open), or a file open without specifying where to open it, and that fails on the remote, it is only logged, with no toast.
- While a new tab or split is being created in a mirror, you can select it and request a split, a new tab, or restoration of a closed item. If the target at the time of input is an existing pane, the command runs immediately. If it targets the place being created, it runs there once creation finishes. If creation fails, the command is skipped. Changing the selection while waiting leaves the target unchanged. Opening a plugin screen as a tab from Tools, the command palette, or a plugin command shortcut follows the same rule. Plugin command shortcuts used while waiting are not passed to the terminal or another action.
- If you ask to open a popup for a pending item, the popup opens on the new Surface once it is created. It still opens on the new Surface if you select another one while waiting. If creation fails, the popup does not open.
- An explicitly specified working directory takes priority over inheritance. With local `general.inherit_cwd` enabled and a remote Tasty that supports this behavior, a new Tab or Pane split in a mirror uses the Surface selected in the target Pane’s selected Tab when you initiate the operation. A Surface split or conversion uses the target Surface. The remote Tasty reads the source’s working directory when it creates the new Surface. An Explorer provides its root directory and a Surface with an open file provides the containing directory. If the chosen source closes before a new Tab or Pane split request is sent, the directory is skipped. If the remote Tasty cannot find the source after the request is sent, it may reject the request.
  - Requests without an inheritance source and older remote Tasty versions that lack this behavior use the remote defaults. For example, on conversion, the remote Tasty uses the working directory of the Surface being converted if its inheritance setting is on. An older remote version can inherit with the local setting off if the remote setting is on.
  - The local **New Workspace** action opens a Workspace on your own computer. If a remote Surface is selected, the new terminal starts in your home folder.
- While a mirror is waiting for a new Tab to be created, if you request an input popup for an operation that creates a new Tab, such as **Open Markdown File**, the popup opens after the Tab is created, using that Tab as its target. If Tab creation fails on the remote, the popup does not open.
- While a mirror waits for a new Tab to be created, built-in actions that target a single Tab run in that new Tab, in the order you pressed them, after it is created. These include Search, Refresh, Convert Surface type, Select all, Copy path, vi copy mode, and Explorer actions: Refresh, go to parent folder, Go to the address bar, the Preview panel toggle, Show or hide hidden files, Properties, Back, forward, New folder, new file, Rename, move to trash, Undo and Redo. Actions that the new Tab type does not support do not run: for example, Explorer actions do not run in a terminal Tab. The Explorer keys for Move between items, extend the selection, Open the selected item and clear the selection do not run in the new Tab when pressed during the wait. Copy, Cut and Paste pressed during the wait do not run in the new Tab. If creation fails or is cancelled, all actions held during the wait are discarded.
- While waiting for a new Tab to be created, the **Close pane:** and **Close active:** shortcuts do not close the Workspace. **Rename Tab**, applying a Tab preset and taking a screenshot do nothing.
- Zoom pressed while a new Tab is being created applies to the font for the type of Tab that is created. If creation fails, it is discarded. If you select a Tab awaiting creation in another Pane and enter a command, it targets that Tab’s Pane. While a new terminal Tab is being created over an Explorer Tab, Explorer keys are not handled as Explorer keys.
- **Move Surface** from the Surface context menu is executed on the remote only within the same mirror Workspace. Moving between a mirror and another Workspace is blocked.
- Moving with **Move Tab** · **Move Pane** from the Tab context menu is not available in a mirror. If the item to move or the destination is a mirror, a toast says it was blocked and nothing changes.
- **Reopening a closed item** (`Ctrl+Shift+T` by default) inside a mirror brings back a Tab that was closed on the remote — that Tab is a remote terminal, so your input goes to the remote too. Its earlier scrollback is fully visible only in the remote window (a mirror starts from the visible screen).
  - A Tab that an agent closed from the CLI inside a mirror is not brought back — not even by reopening from the remote window. Reopening only covers what a person closed by hand.
  - A reopen only brings back what was closed **in that remote Workspace**. If the remote has nothing to reopen you just get an informational toast and nothing happens — a Tab you closed on your own side is never created inside the mirror instead. Go back to your own Workspace and press the same key to reopen yours.
- A Tab that closes on the remote because its shell ended (`exit`) disappears from the mirror right away too.
- The remote terminal's completion · input-needed indicators (border · badge) also arrive in the mirror as they are.
- If part of the remote screen is lost, the mirror usually shows the toast “Part of the remote screen was lost. Fetching it again…” and re-attaches to fetch the screen again (even if you attached without a profile). After it re-attaches, the same screen may appear once more in the scrollback.
  - If a force-detach notice arrives while Tasty is fetching the screen again, the saved row stops trying to reconnect and stays disconnected.
  - Starting a manual connection clears the existing force-detach record. If another saved row for the same remote workspace and profile is force-detached while that connection is pending or after it succeeds, the record can return and block automatic connections again. If the row is blocked when it loses part of the screen, it stays disconnected without retrying or showing the recovery toast. Connect the row yourself to use it again.
- If part of the remote screen is lost during a clipboard image upload, the upload ends as failed and you can try again — it is not resent automatically, because the remote may already have saved it. Each surface shows its own image upload progress and **Transfer failed** popups. If several transfers fail on the same surface, their failure popups appear one at a time. If the surface that started the upload has closed but the connection is still active and its mirror workspace is still present, failure popups appear one at a time in that workspace, with **Retry** disabled. If the connection has dropped or the workspace is gone, the failure is recorded only in the log and no popup appears. The **Transfer failed** and **Download failed** popups for remote files do not close with `Enter` or `Esc` when they lack focus. Click the popup or give it focus before using these keys.
- Pasting a clipboard image uploads it to the remote and inputs the **remote path**. Text is entered unchanged except in the cases below.
  - A capture in a local terminal puts the local file path and image on your clipboard. The remote cannot read that local path. When you use the paste shortcut in a mirror terminal, if the text is a file path directly inside your computer's capture folder, `~/.tasty/screenshots/`, and the clipboard image can be read, Tasty uploads the image and types the remote path. If the image cannot be read, including when the capture copied only the path because the image could not be added, the local path is typed unchanged.
- Pressing [Screenshot to clipboard](../using/terminal.md#screenshot-to-clipboard) (`Ctrl+Alt+S`) inside a mirror captures the screen on your computer, saves the file on the remote, and puts both the remote path and the image on the **remote clipboard**. Your own clipboard does not change. If the remote Tasty is an older version that cannot copy images, only the path goes in and the toast says so. If the file cannot be sent because the remote connection is gone, the toast says it was saved only on your computer, and if the connection drops before the remote answers, it says the copy was not confirmed.
  - The paste shortcut reads your own computer's clipboard. After the capture, if you have not copied different content on your computer, using it in a terminal of the same mirror types the remote file path under `~/.tasty/screenshots/` instead of the local content. If you have copied different content, it types that local content as usual.
  - You can paste the same path several times. The paste target in that mirror changes only when Tasty sends a new screenshot to the remote. If Tasty cannot send it, the paste state stays the same. Once that mirror Workspace disappears from the window, the path is unavailable for this paste.
  - Until the remote returns the saved path, or if its answer has no path, paste types the local content. If the file was saved and its path returned, paste types the remote path even if writing to the remote clipboard failed.
  - Copying the exact same content as before the capture counts as no change, so paste types the remote path. If Tasty sent a new screenshot but could not read the local clipboard just before taking it, neither that screenshot nor the previous one can be pasted this way. If a remote desktop (RDP) client or another program copies the remote clipboard into your local clipboard, the paste shortcut types that copied-in local content.
- Pass a mirror Workspace number to `--workspace` and the child of `tasty claude spawn` or `tasty codex spawn` runs on the remote computer, while you manage it as a child inside that mirror. See [Claude · Codex](../agents/claude-codex.md#creating-children-in-an-attached-remote-workspace) for how to use it.
  - While the connection is down, that child's state shows as `unknown`. Once you reconnect to the same remote Tasty, a completion that happened in the meantime is delivered once.
  - If the remote Tasty restarts, completions of children created before the restart are not delivered. On a remote running an older Tasty, no child is created and you get an error.
- Restarting the shell of a mirror surface (`tasty surface respawn-terminal`, `tasty terminal respawn`) or attaching a background PTY as a tab inside a mirror (`tasty pty attach-surface`) is also refused, because it would put a local shell where the remote terminal is. Run them directly on the remote instance.
- Applying a Tab or Pane preset to a mirror Workspace (the preset popup, `tasty preset apply`) is refused for the same reason. A Workspace preset creates a new Workspace, so it still works.

<a id="osc-52-during-attach"></a>

### Clipboard access from remote programs (OSC 52)

When your local GUI and the remote Tasty both support this feature, an OSC 52 copy from a remote program goes only to your computer's clipboard. The `allow_clipboard_read` setting under `[general]` in your local `config.toml` controls whether Tasty answers read requests with your clipboard contents. It is off by default.

If you attach from a newer GUI to an older server, copying can update both computers' clipboards. The server can answer from its own clipboard if it allows reads, even when you have disabled reads locally. With a CLI attach or an older GUI client, the remote Tasty handles OSC 52 requests.

A progress indicator appears at the upper right of the work area while Tasty receives the content. A quick copy can finish before the indicator appears. Tasty shows one copy confirmation on success. An error notification appears if the write fails, the connection drops mid-copy, or the copy content is lost while the screen recovers. If the source Surface is out of view because you switched tabs or workspaces, the result appears in its window. If you close the mirror yourself or the source Surface disappears on the server, a copy in progress can end without a result notification.

For sounds from remote work, see [Notifications during attach](../agents/hooks-notifications.md#remote-attach-notifications).

## Closing and disconnecting a mirror

Right-click a saved remote row for these actions:

- **Disconnect** — Ends the connection and any ongoing connection or reconnect attempt, keeping the row. The remote workspace and programs keep running, and input becomes available on the remote side again. Explicitly connect the row to use it again.
- **Close locally** — Removes the row from this Tasty and cancels ongoing connection attempts, keeping the remote workspace and programs. The close-workspace shortcut also closes a saved row locally.
- **Close remote workspace…** — While connected, opens a confirmation popup before ending the remote workspace and all its programs. Choosing this for a workspace you are not viewing opens the popup immediately in the center of the current window without switching to that workspace. The popup stays visible when you switch to another workspace. This cannot be undone; success also removes the saved row. Manually closing a connected saved row's last tab, pane, or surface also asks you to confirm the remote close. Agent close requests run without confirmation.

An unsaved mirror attached through the CLI has **Disconnect Workspace** and **Close Workspace** in its card menu. The former removes your mirror while keeping remote work running; the latter ends the remote workspace and programs. Closing its last tab, pane, or surface also closes the remote workspace. Closing the last remote workspace creates a new terminal workspace in the remote window.

Closing a remote workspace removes your mirror only after the remote confirms that it closed, then shows **Closed the workspace on the remote Tasty.** If the remote refuses, the mirror stays and a failure notice appears. A workspace you manually close remotely can be restored through the remote window’s closed-item history, whether it was attached as a saved row or an unsaved mirror. Its running programs do not return.

If disconnecting an unsaved mirror removes your last workspace, your window stays open and a new terminal workspace is created. Disconnecting a saved remote row keeps the row.

A remote close cannot be sent while connecting or reconnecting. If the remote Tasty does not support it, update it or disconnect instead. If the connection drops before the reply, Tasty reports that the close result is unknown. The remote work may still be running; reconnect to check.

The CLI can also disconnect while keeping remote work running:

```sh
tasty remote disconnect --workspace 7
```

`--workspace` takes the **local ID** of the `[mirror]` row in `tasty list workspaces`. A saved row stays in the list; reconnect with `tasty remote connect --workspace <local id>`. For an unsaved mirror, attach again with `tasty remote attach --into-gui --workspace <remote id>`.

On success, the command prints JSON containing `disconnected`, `already_disconnected`, `workspace_id`, and `remote_workspace`, and exits with code 0. For a saved remote row, it also includes `previous_state`, the state before the call (`connected`, `reconnecting`, `connecting`, `disconnected`, `failed`, or `not_connected`). `disconnected` means this call actually disconnected a connection or canceled an ongoing attempt; it does not describe the resulting state.

- If the previous state is `connected`, `reconnecting`, or `connecting`, or there is an attempt to cancel, the command disconnects the connection and cancels attempts, returning `disconnected: true` and `already_disconnected: false`.
- If a saved row's previous state is `disconnected`, `failed`, or `not_connected` and there is no attempt to cancel, the command succeeds with `disconnected: false` and `already_disconnected: true`. This also applies to a row whose remote workspace was closed elsewhere. It does not change the connection state or show the connection notice toast again. It prints a notice to stderr in the app's language saying the workspace was already disconnected and nothing changed. The row is still marked as manually disconnected, so even a row that has never connected will not connect automatically. To use it again, run `tasty remote connect --workspace <local id>`.

If the command is rejected because the ID does not exist or the workspace is not a mirror, it exits with code 1 and prints the reason in a `data:` line below the error on stderr. `data.reason` is `workspace_not_found` for a nonexistent ID, or `not_a_mirror` for a workspace that is neither a saved remote row nor a mirror with an attach session. An unsaved mirror attached through the CLI disappears when disconnected, so a second call with the same ID returns a `workspace_not_found` error.

This differs from **Force detach** in the remote window, which removes someone else's connection from the remote computer.

## Releasing the occupation (on the remote side)

When a Workspace in your Tasty becomes read-only because someone attached from elsewhere, a **Force detach** notice appears on the Surface while you are viewing that Workspace. **Force detach** is always visible below a separator in the right-click menu of a local Workspace card in the sidebar. It is enabled only while another client occupies that Workspace. Saved remote rows and agent mirrors have no such item. Select it and confirm to release the Workspace without switching to it.

Run `tasty remote detach` on the computer hosting the occupied Workspace or Surface to disconnect remote clients occupying that Tasty instance. This also works on a server without a GUI. Choose exactly one of these options.

- `--workspace <id>` takes a Workspace ID on that Tasty instance and disconnects the client occupying it.
- `--surface <id>` takes a Surface ID on that Tasty instance and disconnects the client occupying it. Specifying a Surface in an occupied Workspace releases the entire Workspace.
- `--all` disconnects all remote clients occupying that Tasty instance.

`--all` disconnects clients occupying Workspaces first. It then reads the list again and disconnects clients still occupying Surfaces. It prints per-target results in `workspaces` and `surfaces`. The command exits with code 1 in the following cases.

- If the initial list cannot be read, the command exits with an error and no per-target results.
- If Tasty returns an error response for an individual target, the command records an `error` for that target and continues with the remaining targets.
- If the command loses its connection to Tasty while processing a target, it stops and prints the results so far, including an `error` for that target.
- If the command cannot read the list a second time, it stops and prints the results so far, including `list_error`.

`notified: true` means the server queued the force-detach notice for sending. The connection can still close before the other side receives it. `notified: false` appears in the following cases.

- No client occupied the target. The result also includes `force_detached: false`.
- The occupation was released, but the client's connection was already closed.
- The send queue was full. The server closes the connection without a notice once the current send finishes or times out.

A client that did not receive the notice may reconnect as it would after any other connection loss.

While the other side's user is attached, attempting a split · new Tab · `spawn` locally in that Workspace, applying a Tab or Pane preset from the CLI (`tasty preset apply`), or attaching a background PTY as a Tab (`tasty pty attach-surface`) is refused with an "occupied" error. Use another Workspace, or force-detach and then proceed.

See [Force-detached rows](#force-detached-rows) for what happens on the side that receives the notice.

## Where files received from the remote are stored

Files transferred over the attach channel are stored in `~/.tasty/transfers/`, with a folder cap of 500 MiB. Change it under **Settings** > **General** > **Remote transfer**, or with the CLI.

```sh
tasty settings get-remote-transfer
tasty settings set-remote-transfer --dir ~/Downloads/tasty --max-mb 2000
```

When you pass the `--raw` output of a CLI attach to another command and that command exits first, the attach also ends normally.
Other write errors, such as a permission problem on the output device, are reported as a failure.

## Disconnecting an unresponsive connection

A remote attach connection disconnects after receiving nothing from the other side for the configured time. The default wait has increased from the previous fixed timeout to 30 seconds. Change **Disconnect after**, under **Attach connections**, in **Settings** › **General** › **Remote attach**. The unit is seconds, and the range is 10–600.

Saving applies the value to new connections without restarting; open connections keep their existing value. Each Tasty uses its own value, so increasing yours does not prevent the other side from disconnecting first. CLI attach that does not read the settings file uses 30 seconds. See [Settings](../customize/settings.md) for the file key and how out-of-range file values are handled.

**Keep reconnecting for** under **Settings** › **General** › **Remote attach** controls how long automatic retries continue after a saved remote row’s connection drops. The default is 300 seconds, with a range of 0–3600; 0 disables automatic reconnecting. It does not apply to connections you end yourself. The configuration key is `[remote_attach] reconnect_timeout_secs`.

## While waiting for a response

When you create a new tab or split in a mirror, Tasty shows its place from the next frame. You can type in the new terminal once it has been created. While waiting, you can select an existing tab or area and keep working. If you select somewhere else while waiting, a late completion does not move your selection back. A failed request removes only its own temporary area.

After 200 ms without a response, spinners appear in the Tab and sidebar, and **Waiting for response** with the elapsed time appears at the top-right of the Workspace. With several requests, it shows their count and the longest wait. Hover over it to see the longest wait for each request kind on its own line. Closing, moving, reopening, converting, and folder, document, or Git queries also show a wait without blocking the screen or input. Native WebViews stay visible and use the Tab and sidebar indicators.

The spinner appears only in place of the Tab icon, the sidebar status dot, or the avatar in the collapsed sidebar; Tab titles and Workspace names do not change. Hover over a waiting Tab or Workspace to see **Attaching…** under its name.

For ordinary input, a server that supports input acknowledgments confirms that preceding input has reached the app's processing boundary. This does not mean a shell command or program has finished. Normal input without output and long-running commands do not keep the indicator on; older servers are not asked for unsupported input acknowledgments. If the connection drops, saved rows show their state through the connection popup and indicators; unsaved CLI mirrors are removed.

## Troubleshooting

| Symptom | What to check |
|---|---|
| `kind='ssh'` refused | You passed an ssh profile to `--profile`. Create a `tasty-attach` profile and specify that |
| Remote tasty not found | Is Tasty running on the remote? Verify the port with `tasty tool remote-profile detect --name <n>`. If it is not on PATH, specify the executable path or `--port-mode file-unix` |
| Timeout | Check whether you can reach the host and whether the firewall permits the connection. ssh profile `--option ConnectTimeout=<seconds>` |
| SSH connection failed | Authentication · host key. First check that `tasty tool ssh <ssh profile>` connects |
| A notice or error that the profile points to this Tasty itself | The profile's host (including a host name or LAN IP) and port file, or the port given with `--into-gui --target-port` (including an SSH tunnel you opened yourself), point to the Tasty you are using. You cannot attach to itself. To attach to another Tasty on the same computer, give that instance's port file |
| An error that `--into-gui` is not supported in this build | The local Tasty that received the command is a windowless [headless build](../getting-started/install.md#headless-build). It has no window to show the mirror in, so it does not accept the request. Send it to a Tasty running with its GUI |
| An `ssh` process remains after Tasty was force-quit | On macOS the remote attach tunnel is cleaned up only on a normal exit (Quit from the menu or closing the window). End a leftover `ssh -N -L` process yourself after a force quit or a crash. On Linux and Windows it ends together with Tasty |
| Workspace attach refused | One of the terminals inside it is already occupied by another client. Force-detach on the remote |
| Screen flickers briefly when first attaching | Normal behavior while the remote re-lays out to your Pane size |

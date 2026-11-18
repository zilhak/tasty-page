<!-- source-hash: 308387cf9570 -->
# Lua 脚本

在 Tasty 中注册的 Lua 脚本可通过快捷键运行，也可设置为在窗口、工作区或标签页打开和关闭时自动运行。

注册要使用的脚本，并关联运行脚本的快捷键或事件。未注册的文件不会在启动时自动运行。

## 注册

在 **设置** <!-- en: Settings --> > **其他** <!-- en: Misc --> > **脚本** <!-- en: Scripts --> 中点击 **添加脚本** <!-- en: Add script -->。

- **文件** <!-- en: File --> — `.lua` 文件路径。也可通过 **浏览…** <!-- en: Browse… --> 选择。存放位置不限，惯例是 `~/.tasty/scripts/`。
- **显示名称** <!-- en: Display name --> — 在列表和按键绑定界面中显示的名称。留空则使用文件名。

注册后，列表中会新增一行，同时显示关联的按键绑定。尚未关联时显示 **未绑定** <!-- en: Unbound -->。可在该行重命名或移除脚本。移除时也会解除关联的按键绑定。

## 通过按键绑定运行

在 **设置** > **按键绑定** <!-- en: Keybindings --> > **运行脚本** <!-- en: Run Scripts --> 中，为每个已注册的脚本指定组合键。按下指定组合键即可立即运行。

## 由事件自动触发运行

在脚本行下方的 **自动运行** <!-- en: Auto-run --> 一行中，通过 **添加触发器…** <!-- en: Add trigger… --> 选择事件。可关联多个事件，已关联的事件显示为标签，点击即可移除。所有事件均已关联时，**添加触发器…** 会保持禁用状态。

| 事件 | 触发时机 |
|---|---|
| `tasty.startup.post` | tasty 完全启动后立即触发 |
| `window.create.post` · `window.delete.post` | 窗口创建或关闭时 |
| `workspace.create.post` · `workspace.delete.post` | 工作区创建或关闭时 |
| `workspace.change.post` | 在窗口中直接更改工作区名称或描述时 |
| `tab.create.post` · `tab.delete.post` | 标签页创建或关闭时 |
| `tab.change.post` | 在窗口中直接更改标签页名称时 |
| `pane.create.post` · `pane.delete.post` | 窗格创建或关闭时 |
| `surface.create.post` · `surface.delete.post` | Surface 创建或关闭时 |

这两种名称更改事件 **仅在窗口中直接更改名称时** 触发。通过 CLI 更改名称不会触发这些事件。

自动运行的脚本通过 CLI 引发其他事件时，可能形成连锁触发。为防止重复运行，在自动运行期间及刚结束后，会暂缓新的自动运行。

## 脚本可执行的操作

脚本可使用以下 Tasty 函数。

| 函数 | 作用 |
|---|---|
| `tasty.tree()` | 以 Lua 表返回工作区、窗格、标签页和 Surface 结构的副本。顶层是工作区数组，没有单独的窗口层级 |
| `tasty.run_cli(args)` | 运行 `tasty` 命令。传入单个字符串或字符串表 |
| `tasty.log(msg)` · `tasty.warn(msg)` | 写入日志 |
| `tasty.on(event, cb)` | 注册事件触发时调用的函数。可接收事件并执行后续任务，但不能取消或更改已发生的事件 |

实际操作 tasty 大多通过 `tasty.run_cli` 完成。无论创建工作区还是发送通知，凡是通过 [CLI](../agents/cli.md) 能完成的操作，在这里都能完成。

```lua
-- 记录工作区数量并发送通知
local tree = tasty.tree()
tasty.log("workspaces: " .. tostring(#tree))
tasty.run_cli({ "notify", "新工作区", "--title", "script" })
```

可照常使用 Lua 标准库的文件输入输出和外部命令执行功能。运行在本机编写的脚本，不通过单独的沙箱隔离。

### `tasty.tree()` 的返回结构

`tasty.tree()` 返回调用时最近一次生成的树的副本。修改返回的表不会改变 Tasty 的状态。`tasty.run_cli` 仅请求执行，不等待完成，因此紧接着调用 `tasty.tree()` 时，树中不一定已包含执行结果。

工作区按窗口依次追加到数组中。已打开的窗口（包括隐藏或最小化的窗口）中的工作区排在前面，窗口之间的顺序不固定。在 macOS 上通过 Tasty 的 **最小化** <!-- en: Minimize --> 转入后台的窗口中的工作区，按窗口转入后台的顺序排在后面。同一次操作中一起转入后台的窗口之间，顺序不固定。

| 层级 | 字段 |
|---|---|
| 工作区 | `id`、`name`、`active`（该窗口中选中的工作区，包括转入后台的窗口）、`busy_count`（工作区内处于 busy 状态的 Surface 数量）、`panes` |
| 窗格 | `id`、`focused`（该工作区中具有焦点的窗格）、`busy_count`（窗格内所有标签页中处于 busy 状态的 Surface 数量，包括未选中的标签页）、`tabs` |
| 标签页 | `id`、`name`、`active`（该窗格中选中的标签页）、`busy_count`（标签页内处于 busy 状态的 Surface 数量）、`busy`（标签页内至少有一个 Surface 处于 busy 状态时为真）、`surface` |
| `tab.surface`（已拆分的标签页） | `type = "SplitLayout"`、`focused_surface`（该标签页中具有焦点的 Surface id）、`surfaces`（标签页内 Surface id 的数组）、`layout`。没有 `busy` 字段 |
| `layout` 节点 | `Leaf`：`type`、`id`、`kind`、`busy`。`Split`：`type`、`direction`（`horizontal` · `vertical`）、`ratio`、`focus_second`、`first`、`second`。`Split` 没有 `busy` 字段 |
| `tab.surface`（未拆分的标签页） | 单个 Surface。所有 Surface 都有 `id`、`type` 和 `busy`，其他字段因类型而异。终端的 `type = "Terminal"`，`cols` 和 `rows` 在这棵树中始终为 0 |

`focus_second` 是创建或恢复拆分时设置的值，可能与当前焦点不同。使用 `focused_surface` 判断当前焦点。

### 查找具有焦点的 Surface

按以下顺序查找一个窗口中具有焦点的 Surface id。转入后台的窗口也包括在内。

1. 查找 `active` 为真的工作区。
2. 在其中查找 `focused` 为真的窗格。
3. 在其中查找 `active` 为真的标签页。
4. 如果 `tab.surface.type` 为 `"SplitLayout"`，则读取 `tab.surface.focused_surface`，否则读取 `tab.surface.id`。

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

### 树无法区分的情况

`active` 和 `focused` 按窗口确定，包括转入后台的窗口。有多个窗口时，每个窗口都有一个 `active` 为真的工作区。树中没有标识窗口的字段，因此无法区分哪个窗口具有操作系统焦点，或哪些窗口显示在屏幕上。像上面的示例一样选择第一个 `active` 工作区，可能返回其他窗口的 Surface。通过 **最小化** 将 Tasty 转入后台后，可能返回未显示在屏幕上的窗口中的 Surface。

## 文件更改时

注册时记录文件的哈希值，每次运行时与当前文件比较。在编辑器中修改脚本后，列表中会出现 **已更改** <!-- en: changed --> 标记。

- **通过按键绑定运行** — 显示确认对话框。批准后，使用新内容运行并更新哈希值。更新后的哈希值适用于所有窗口，因此在其他窗口中运行也不会再次询问。
- **自动运行** — 阻止运行，并在通知列表中留下警告通知。目的是防止脚本在无人查看期间被更改后运行。在列表中查看标记，手动运行一次并批准后，即可恢复运行。

不检查通过 `require` 加载的其他文件。

## 执行限制

- 有内存上限，超出时仅中止本次运行。
- 执行 Lua 指令时会检查时间限制，以中止无限循环。等待文件输入输出或外部命令期间，可能无法立即中止。应用界面独立运行。
- 仅接受文本源码。拒绝预编译的字节码。
- 调试库和任意代码加载类函数已被禁用。

## 出现问题时

- **通过按键绑定运行的脚本** — 无法运行或运行失败时，会在按下快捷键的窗口中显示失败短暂提示。包括注册项已消失、无法读取文件、脚本出错、超出时间限制、运行队列已满等情况。如果在结果返回前关闭了该窗口，不会在其他窗口中显示。
- **自动运行** — 因文件更改而被阻止、读取或运行失败、为防止连锁触发而跳过时，会在通知列表中留下警告通知。不显示弹窗。相同内容的通知在 10 秒内只记录一次。

运行成功时不显示任何内容。提高日志级别可查看详细原因。

```sh
TASTY_LOG=tasty_lua=debug tasty
```

<a id="接下来阅读"></a>

## 相关阅读

- [按键绑定](keybindings.md) — 指定组合键和预设
- [设置](settings.md) — 整个设置窗口和配置文件位置
- [使用 tasty CLI](../agents/cli.md) — 可通过 `tasty.run_cli` 调用的命令

通过快捷键运行脚本时，会在后台读取文件。如果读取的内容与注册时不同，会在现有确认弹窗中取得批准后运行。脚本文件最多读取 8 MiB。

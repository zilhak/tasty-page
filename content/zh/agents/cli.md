<!-- source-hash: ea95539b4b25 -->
# 使用 tasty CLI 操作终端

`tasty` CLI 连接到运行中的 Tasty，支持创建终端、发送输入和读取输出。检查连接和目标 ID 后发送命令，再用 `read since-mark` 读取标记位置之后的输出。脚本和 AI 智能体可以使用相同的命令。

首次使用时按本页顺序操作即可。检查连接、查找目标 ID、创建一个工作终端、发送命令并读取输出，最后清理终端。指定读取位置、元数据、队列、记忆等其他命令见 [CLI 命令参考](cli-reference.md)，响应延迟、连接和各错误码的处理方法见 [CLI 响应延迟和连接诊断](../help/cli-diagnostics.md)。

## 准备

- Tasty 必须正在运行。CLI 通过 `~/.tasty/tasty.port` 中记录的端口连接到运行中的实例。
- 在 Tasty 打开的终端中，`tasty` 已在 PATH 中。要在外部（其他终端应用）使用，将 Tasty 可执行文件所在路径加入 PATH。各安装方式的路径见[安装](../getting-started/install.md#安装位置)。
- Tasty 启动的 Shell 中有 `TASTY_SURFACE_ID` 环境变量。大多数省略 `--surface` 的命令使用此值（`tasty new workspace` · `tasty output observe start` 除外），因此操作自己的终端时可以不写 ID。
- 安装 Codex 插件后，在 Codex 执行命令的环境中（存在 `CODEX_THREAD_ID` 的环境），该 Shell 的 `TASTY_SURFACE_ID` 可能属于其他终端，因此插件添加的命令（如 `tasty codex …`、`tasty claude …`）不会用此值填充 `--surface`。需要目标时用 `--surface` 指定。如果 `CODEX_THREAD_ID` 值无效，`tasty codex …`、`tasty claude …` 不会执行，其他插件命令照常执行。
- 即使从另一个 Tasty 的终端中启动 Tasty，新 Tasty 启动的 Shell 和钩子命令也不会继承外层 Tasty 的会话令牌（`TASTY_SESSION_TOKEN`）和智能体 ID（`TASTY_AGENT_ID`）。在其中调用的 `tasty` 命令以普通用户身份连接新 Tasty。

```sh
echo $TASTY_SURFACE_ID     # 例如：42
tasty list info            # 版本、所查询窗口的工作区数量——用于检查连接
```

## 术语和 ID

Tasty 的界面按**工作区 > 窗格 > 标签页 > Surface** 的顺序嵌套。Surface（surface）是显示实际内容的区域，如终端或 Markdown 文档。直接指定目标 ID 的命令会使用该目标，与哪个窗口拥有焦点无关。

```sh
tasty list tree            # 以树状显示整个层级
tasty list workspaces      # 工作区列表
tasty list surfaces        # Surface（终端）列表——所有工作区
tasty list panes           # 窗格列表
tasty list tabs --pane 3   # 指定窗格的标签页
tasty list surface-kinds   # 此实例实际注册的 Surface 种类
```

`list tree` 还会显示拆分结构。拥有焦点的 Surface 标有 `*focus`。

```
└─ vertical (L|R) 60:40
   ├─ surface:396 (terminal)
   └─ horizontal (T|B) 50:50
      ├─ surface:417 (terminal) *focus
      └─ surface:418 (markdown)
```

`list surface-kinds` 显示当前可用 `--type <种类>` 创建的 Surface 种类。插件未运行或当前构建不支持的种类不会出现在列表中。禁用或移除插件后，该插件的种类会立即移出列表，创建该种类的请求会报错，提示提供该种类的插件已禁用或尚未重新连接。每行可查看渲染方式，以及提供功能的插件或内置功能。

`list workspaces` 的行格式为 `名称 (id:N) (窗格数量)`。活动工作区标有 `*`，远程镜像标有 `[mirror]`（[继续远程工作](../remote/attach.md)）。

## 首次实践：在工作终端中运行命令

不要向用户正在使用的终端发送命令，应单独创建工作标签页并使用其 ID 操作。以下示例中的 `3` 和 `57` 是占位符。实际使用前一条命令响应中的值。

```sh
tasty list panes                               # 查看要创建标签页的窗格 ID（例如：3）
tasty new tab --pane 3 --cwd ~/proj            # 响应中的 surface_id 是新终端（例如：57）
tasty set mark --surface 57                    # 标记当前输出位置
tasty read last-command --surface 57           # 发送前记下 ended_at
tasty send text "ls\r" --surface 57            # 发送命令（\r 是 Enter）
tasty read last-command --surface 57           # ended_at 变化表示命令已结束
tasty read since-mark --surface 57 --strip-ansi # 读取标记之后的输出
tasty close surface --surface 57               # 清理用完的终端
```

- 用 `new tab` 创建的标签页不会改变用户正在查看的标签页。使用响应中的 `surface_id`，不要使用 `active_tab`。
- 不要仅凭等待固定时间或输出为空来判断命令是否结束。在 bash、zsh 中，Shell 集成为每条命令留下结束记录，因此应比较发送前后的 `read last-command` 响应中 `ended_at` 是否变化，并检查 `exit_code`。在没有 Shell 集成的 Shell 中，用 `read screen` 检查提示符是否已返回。
- 要查看某条命令的所有参数，运行 `tasty help <命令>`。例如：`tasty help read since-mark`。

## 常用命令表

| 目的 | 命令 |
|---|---|
| 查看层级结构 | `tasty list tree` |
| Surface 列表 | `tasty list surfaces` |
| 创建工作标签页 | `tasty new tab --pane ID` |
| 发送文本（含 Enter） | `tasty send text "ls\r" --surface ID` |
| 发送按键 | `tasty send key enter --surface ID` |
| 设置标记 | `tasty set mark --surface ID` |
| 读取标记之后的内容 | `tasty read since-mark --surface ID --strip-ansi` |
| 最后一条命令的结束记录 | `tasty read last-command --surface ID` |
| 读取屏幕 | `tasty read screen --surface ID --lines N` |
| 关闭 Surface | `tasty close surface --surface ID` |
| 通知 | `tasty notify "正文" --title "标题"` |
| 截图 | `tasty screenshot --path out.png [--surface ID] [--window ID]` |
| 帮助 | `tasty help`、`tasty help <命令>`（= `tasty <命令> --help`）、`tasty -a`（所有命令路径及简短说明。参数见各命令的 `--help`） |

`tasty help` 按基本操作、智能体协作、后台、远程等用途分组显示命令，并在开头说明首次操作顺序。`-h` 显示简短说明，`--help` 和 `tasty help <命令>` 显示详细说明。Claude、Codex 帮助中最后的“内部集成”组是钩子调用的命令，不直接输入。

## 基本模式：标记 → 发送 → 读取标记之后的内容

在发送命令前留下标记，然后读取后续输出。同一终端产生的其他输出也可能包含在内。

1. `tasty set mark`——在当前输出位置留下标记。
2. `tasty send text "命令\r"`——发送文本。`\r` 是 Enter。
3. 命令结束后，`tasty read since-mark --strip-ansi`——仅读取标记之后产生的输出。

```sh
tasty set mark --surface 42
tasty send text "cargo test 2>&1 | tail -20\r" --surface 42
# 是否结束，按下方首次实践中的方式，用 read last-command 或 read screen 检查
tasty read since-mark --surface 42 --strip-ansi
```

- `send text` 解析 `\r` `\n` `\t` `\\` `\0` 转义序列。在 Shell 引号中原样写入即可。
- 添加 `--strip-ansi` 后会返回去除颜色等控制序列的纯文本。解析输出时始终添加此选项。
- 标记会保留到再次调用 `set mark` 为止。`read since-mark` 不移动标记，因此多次读取会返回同一区间。

不确定命令是否结束时，读取屏幕，查看提示符是否已返回。

```sh
tasty read screen --surface 42 --lines 5     # 屏幕底部 5 行（不足时延伸到回滚缓冲区）
tasty is-typing --surface 42                  # 最近 5 秒内是否有人按键或粘贴
```

`read screen` 默认排除以暗色显示的自动补全建议（例如 Claude Code 的灰色建议文本）。要包含这些内容，使用 `--show-dim`。此排除规则适用于所有以暗色绘制的字符，不仅限于输入建议。如果响应中的 `dim_omitted_rows` 大于 0，表示有些行因暗色字符被排除而发生变化，应使用 `--show-dim` 重新读取并比较。

在通过远程连接（attach）打开的镜像终端中使用 `read screen`、`read since-mark`、`set mark` 时，读取的是远程计算机上的原始终端。单次返回的输出可能更少，使用响应中的 `next_cursor` 继续读取。远程 Tasty 不支持此功能或连接中断时会返回错误，应将远程 Tasty 更新到相同版本，或在重新连接后读取。

如果返回的行数少于 `--lines N`，检查响应中的 `scrollback_len`。值为 `0` 表示没有更多可读取的回滚缓冲区内容。首次运行全屏应用（TUI）时可能出现这种情况。如果回滚缓冲区仍有内容，但返回行数少于请求行数，应检查输出查询。`alt_screen` 表示当前是否正在使用全屏应用。

## 发送按键

Enter 以外的按键使用 `send key` 发送。

```sh
tasty send key enter --surface 42
tasty send key ctrl+c --surface 42
tasty send key escape --surface 42
tasty send key up --surface 42
```

按键名称：`enter` `tab` `escape`（或 `esc`）`backspace` `delete` `insert` `up` `down` `left` `right` `home` `end` `pageup` `pagedown` `f1`～`f12`。组合键用 `+` 连接，如 `ctrl+c` `alt+x`。接受 `shift+`，但会忽略它。

## 启用 Shell 集成时：按命令读取

Tasty 会为 bash / zsh 自动配置 Shell 集成，因此可以按命令查询已执行的命令及其退出码。

```sh
tasty read commands --surface 42       # 已记录的命令列表
tasty read last-command --surface 42   # 最后一条命令（命令字符串、退出码）
tasty read command-at --surface 42 --index -1   # 倒数第一条（从 0 开始，负数从末尾计数）
```

fish 等其他 Shell 如果未手动安装 Shell 集成，会返回空列表。

## 创建和关闭终端

```sh
tasty new workspace --name build --cwd ~/proj          # 新建工作区
tasty new workspace --surface 42                       # 在 Surface 42 所在窗口中新建工作区（工作目录也取自 Surface 42）
tasty new window                                        # 新建窗口（响应中包含 window_id）
tasty split --level surface --surface this --direction vertical  # 将自己的 Surface 左右拆分
tasty split --level pane --pane 3 --direction horizontal          # 拆分窗格
tasty new tab --pane 3 --cwd ~/proj                     # 在窗格中新建标签页
tasty close surface --surface 99                        # 关闭 Surface
tasty close tab --tab 12
tasty close workspace --workspace 3                     # 关闭整个工作区（包括其中的标签页和 Surface）
tasty close window --window 1                           # 关闭窗口
tasty close self                                        # 关闭当前 Surface
```

旧写法 `split --target-surface`、`--target-pane`、`close workspace|window --id` 仍然接受。同时使用两种写法会被视为重复提供同一选项而拒绝。

`--surface this` 指自身（`TASTY_SURFACE_ID`）。也可以创建终端以外的 Surface，如 `--type markdown --file README.md`（[文件管理和查看](../using/files.md)）。`new workspace` · `new tab` · `split` 的 `--cwd` 也适用于文件浏览器（`--type explorer`），未指定 `--path` 时以该文件夹为根目录打开。两者都指定时，`--path` 优先。文件浏览器省略 `--cwd` 时也不会继承其他 Surface 的工作目录，而是打开主目录。

通过 `tasty new tab` 打开的标签页，无论种类如何，都不会改变用户正在查看的标签页。新标签页添加到窗格末尾，在用户选择前保持在后台。响应中的 `active_tab` 是该窗格当前选中的标签页，而非新标签页，因此操作新标签页时使用响应中的 `surface_id`。用户通过快捷键或菜单直接打开的标签页会立即选中。

通过 `tasty new window` 打开的窗口不会夺取用户正在查看的窗口的焦点。因此，随后未指定目标的命令（如 `tasty new workspace`）会在用户正在查看的窗口中创建内容，而非新窗口。

要在新窗口中创建工作区，用 `tasty new workspace --surface <ID>` 指定该窗口的 Surface ID——`tasty list windows` 显示每个窗口的 `workspace_ids`，`tasty list surfaces` 显示每个 Surface 的 `workspace_id`。如果指定的 Surface 不在任何窗口中，命令会报错结束，不会转向其他窗口。省略 `--cwd` 时，新工作区的工作目录继承自指定的 Surface（不是该窗口中用户正在查看的 Surface）。

新窗口出现在用户正在查看的窗口后方，也不会夺取键盘输入（macOS · Windows）。在 Linux 的 X11 下，会向窗口管理器发出此请求，但是否遵从由窗口管理器决定；在 Wayland 下由合成器决定。无论哪种情况，未指定目标的命令所指向的窗口都不会改变。

不能关闭最后一个工作区或最后一个窗口。关闭工作区不会让窗口一起消失，而是会
被拒绝，因此要关闭窗口时应单独使用 `tasty close window`（无窗口运行的
[无界面构建](../getting-started/install.md#无界面构建)没有可关闭的窗口，因此无法关闭最后一个工作区）。包含自身终端的目标也
不能关闭——此时使用 `tasty close self`。连接远程并以镜像显示的工作区也不能关闭——
应通过断开连接清理。反过来，包含**有人正通过远程连接使用的终端**的
工作区也不能关闭——只有对方断开连接后才能关闭。关闭未在查看的工作区时，屏幕上显示的工作区
保持不变。

**关闭工作区无法撤销。** 其中运行的终端会全部终止，无法从“已关闭项目”中
恢复，回滚缓冲区也不会保留。恢复已关闭项目仅适用于用户在界面中直接关闭的项目。
关闭前先用 `tasty list workspaces` 确认目标是否正确。

## 用户正在输入时不发送

```sh
tasty send text "make test\r" --surface 42 --wait-idle
```

`--wait-idle` 一次完成判断和发送。如果先用 `tasty is-typing` 检查再发送，两者之间
用户可能开始输入，此标志消除了这一间隙。正在输入时不发送，
返回 `"sent": false` 及原因。

## 故障排除

- **连接失败**——检查 Tasty 是否正在运行，以及 `~/.tasty/tasty.port` 文件是否存在。即使文件存在，也可能是上次运行留下的文件，或是其他实例的路径（[故障排除](../help/troubleshooting.md)）。
- **省略 `--surface` 时被拒绝**——在没有 `TASTY_SURFACE_ID` 的 Shell 中（Tasty 外部），无法确定目标 Surface，因此命令会报错结束。Tasty 不会猜测拥有焦点的 Surface——无论哪个窗口位于前台，相同命令都会得到相同结果。在脚本中始终指定 `--surface`。
- **`read since-mark` 为空**——输出在设置标记前已经结束，或命令尚未结束。用 `read screen` 查看当前状态。
- **不确定 `screenshot` 会截取哪个窗口**——自动选择只统计**主窗口（终端窗口）**。只有一个主窗口时，不指定 `--window` 就截取该窗口；有多个主窗口时，必须指定 `--window`（不会任意选择拥有焦点的窗口）。设置窗口等未出现在 `list windows` 中的窗口不计入其中——即使设置窗口已打开，不指定 `--window` 仍会截取主窗口；要截取设置窗口本身，用 `--window` 直接指定其 ID。

没有响应时，不要用 Shell 的 `timeout` 中止 `tasty` 并重复同一请求。关闭连接不会取消已发送的请求。Tasty 忙碌时积压的请求可能稍后集中执行，如果是发送输入的命令，相同输入就会重复发送。

需要限制响应等待时间时，对单次请求即可结束的命令使用 `--response-timeout-ms`，将标志放在命令之前。未能在期限内开始处理的请求会以 `Error (-32067)` 结束，之后也不会执行。开始处理后超过期限，则以 `Error (-32061)` 结束，结果未知，任务可能继续运行。反复查询或保持连接的命令收到此标志时，不会发送请求，而是以退出码 2 拒绝。哪些情况可以重新发送、哪些情况应先检查状态，见[设置响应等待上限](../help/cli-diagnostics.md#设置响应等待上限)。其他错误码的处理方法见 [CLI 响应延迟和连接诊断](../help/cli-diagnostics.md)。

## 查找其他命令

入门部分未涉及的命令见按用途划分的页面。

- <a id="多个智能体读取同一终端时保留位置并读取"></a>[多个智能体读取同一终端时：保留位置并读取](cli-reference.md#多个智能体读取同一终端时保留位置并读取)
- <a id="查看-surface"></a><a id="检查-surface-状态"></a>[检查 Surface 状态](cli-reference.md#检查-surface-状态)
- <a id="为子智能体授予权限"></a>[为子智能体授予权限](cli-reference.md#为子智能体授予权限)
- <a id="发送通知"></a>[发送通知](cli-reference.md#发送通知)
- <a id="在-surface-上留下备注-元数据"></a>[在 Surface 上留下备注（元数据）](cli-reference.md#在-surface-上留下备注元数据)
- <a id="在-surface-之间收发消息-队列"></a>[在 Surface 之间收发消息（队列）](cli-reference.md#在-surface-之间收发消息队列)
- <a id="将子终端作为智能体运行"></a><a id="将任务交给多个终端"></a>[将任务交给多个终端](cli-reference.md#将任务交给多个终端)
- <a id="无界面-pty"></a>[无界面 PTY](cli-reference.md#无界面-pty)
- <a id="智能体共享的记忆"></a>[智能体共享的记忆](cli-reference.md#智能体共享的记忆)
- <a id="从输出中提取信号-观察者"></a><a id="从输出中收集所需信息-观察者"></a>[从输出中收集所需信息（观察者）](cli-reference.md#从输出中收集所需信息观察者)
- <a id="测量智能体活动"></a><a id="查看智能体用量"></a>[查看智能体用量](cli-reference.md#查看智能体用量)
- <a id="其他查询和设置"></a>[其他查询和设置](cli-reference.md#其他查询和设置)
- <a id="设置响应等待上限"></a>[设置响应等待上限](../help/cli-diagnostics.md#设置响应等待上限)
- <a id="检查响应延迟和连接状态"></a><a id="连接数和上限-connections"></a><a id="耗时分布"></a><a id="数据库设置-db_pragmas"></a><a id="画面传输-stream_push"></a><a id="请求队列-queue_admission-queue_dispatch"></a><a id="重复请求处理-keyed_requests"></a><a id="慢请求详情-slow_requests"></a><a id="请求拒绝原因-gate_refusals"></a>[检查响应延迟和连接状态](../help/cli-diagnostics.md#检查响应延迟和连接状态)

<a id="接下来阅读"></a>

## 相关阅读

- [与 Claude、Codex 配合使用](claude-codex.md)——启动子智能体并接收完成通知。
- [管理任务顺序](tasks.md)——按依赖关系组织多个任务并依次执行。
- [钩子 · 通知 · Webhook](hooks-notifications.md)——通过事件自动执行命令。
- [CLI 命令参考](cli-reference.md)——按用途查找入门以外的命令。
- [CLI 响应延迟和连接诊断](../help/cli-diagnostics.md)——响应延迟、连接数及各错误码的处理方法。

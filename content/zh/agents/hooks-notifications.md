<!-- source-hash: 92f6a783624e -->
# 钩子、通知和 Webhook

钩子按 Tasty 事件执行操作，通知在应用内显示待查看事项。Webhook 接收外部服务的 HTTP 请求。按需选择并配置。

- 配置钩子以响应事件。
- 在通知面板和 Surface 标记中查看通知。
- 通过 Webhook 接收外部请求。接收响应不表示执行完成。
- 需要等待决定和响应时，使用批准请求。

## Surface 钩子

无界面实例也会执行 Shell 退出钩子。关闭 Surface 时，也会清理该 Surface 上剩余的钩子注册，包括未带 `--once` 的钩子。

在指定 Surface（终端）发生事件时执行 Shell 命令。

```sh
tasty set hook --surface 42 --event process-exit --command "tasty notify 'Shell 已退出'"
tasty set hook --surface 42 --event 'output-match:error\[E\d+\]' --command 'tasty notify "$TASTY_HOOK_MATCHED_TEXT"'
tasty set hook --surface 42 --event idle-timeout:30 --command "tasty notify '30 秒无输出'" --once
tasty list hooks [--surface 42]
tasty unset hook --hook <HOOK_ID>
```

| 事件 | 触发时机 |
|---|---|
| `process-exit` | Shell 进程退出时 |
| `bell` | 收到响铃（`\a`）时 |
| `notification` | 收到终端通知序列（OSC 9/99/777）时 |
| `output-match:<正则表达式>` | 输出的**完整一行**匹配正则表达式时 |
| `idle-timeout:<秒>` | N 秒内无输出时（以 1 秒为单位，收到新输出后重新等待） |
| `command-completed` | Shell 内一条命令结束时（需要 bash/zsh Shell 集成） |
| `command-completed:<退出码>` | 仅匹配以该退出码结束的命令（例如：`command-completed:1` = 失败的命令） |
| `claude-idle` / `needs-input` / `codex-idle` | Claude Code / Codex 插件发送的事件（[Claude · Codex](claude-codex.md)） |
| `claude-stop-failure` | Claude Code 的轮次因 API 错误（服务器过载、请求限制、认证失败等）结束时。通常与 `claude-idle` 一同到达；若仍有后台任务，则只发送此事件 |
| `claude-error` | Claude Code 屏幕输出出现已知错误文本时 |
| `claude-error-stalled` | Claude Code 输出默认 10 分钟（可配置）未变化时。轮次中最后一次输出有错误时，固定为 30 秒；排除仅剩 Monitor 的等待（[各类等待的阈值和接收条件](claude-codex.md#4-接收完成通知)） |

- 加上 `--once` 后，执行一次即自动删除。默认持续保留。
- 钩子命令在后台执行，不阻塞终端输入。
- 没有 Shell 集成时，`command-completed` 绝不会触发。缺少 Shell 集成的本地 Surface 会显示一次提示横幅，10 秒后自动关闭。

事件信息通过环境变量传入命令。

| 变量 | 值 |
|---|---|
| `TASTY_HOOK_EVENT` | 注册的事件字符串（`bell`、`output-match:…` 等） |
| `TASTY_HOOK_SURFACE_ID` | 事件发生所在的 Surface ID |
| `TASTY_HOOK_MATCHED_TEXT` | `output-match` 实际匹配的整行 |
| `TASTY_HOOK_EXIT_CODE` | `command-completed` 的退出码 |
| `TASTY_HOOK_IDLE_ELAPSED_SECS` | `idle-timeout` 中距最后一次输出经过的秒数 |
| `TASTY_HOOK_CUSTOM_EVENT` | 插件事件（`claude-idle` 等）的名称 |
| `TASTY_HOOK_SOURCE` | 由钩子执行时为 `hook`，通过 `tasty hook-handler dispatch` 直接执行时为 `dispatch` |

除 `TASTY_HOOK_EVENT`、`TASTY_HOOK_SOURCE`、`TASTY_HOOK_SURFACE_ID` 外，变量均由事件信息的键名生成。键中的英文字母和数字转为大写，其余字符替换为 `_`，再加在 `TASTY_HOOK_` 后（`matched_text` → `TASTY_HOOK_MATCHED_TEXT`）。通过 `tasty hook-handler dispatch --body '{"build-id":7}'` 执行以 Shell 命令运行的钩子处理器时，`--body` 对象的顶层键也按同一规则传入（`TASTY_HOOK_BUILD_ID=7`）。字符串原样传入，其他值以 JSON 文本传入，每个值在 4096 字节处截断。名称重复时，使用先生成的值。

## 全局钩子

按时间条件执行，与 Surface 无关。

```sh
tasty set global-hook --condition interval:60 --command "df -h > ~/disk.log" --label "磁盘记录"
tasty set global-hook --condition once:300 --command "tasty notify '已过 5 分钟'"
tasty list global-hooks
tasty unset global-hook --hook <HOOK_ID>
```

| 条件 | 含义 |
|---|---|
| `interval:<秒>` | 每 N 秒重复执行 |
| `once:<秒>` | N 秒后执行一次并删除 |

## 钩子处理器（可复用的操作）

可通过名称关联预先注册的**钩子处理器**，代替 `--command`。多个钩子和 Webhook 可共享同一处理器。

```sh
tasty hook-handler list                                     # 已注册的处理器 (host / plugin / user)
tasty set hook --surface 42 --event bell --handler user/my-handler
tasty hook-handler get --id user/my-handler                 # 查看单个处理器详情（包括执行的操作）
tasty hook-handler dispatch --id user/my-handler            # 直接执行以测试
tasty hook-handler reload                                   # 重新读取 ~/.tasty/hook-handlers.toml
```

`dispatch` 先输出表示已接收的一行（含 `run` 编号），然后等待执行结束并输出结果行。结果中的 `state` 在全部成功时为 `succeeded`，部分成功时为 `partial`，全部失败时为 `failed`，未收到响应、无法确定结果时为 `unknown`；`result` 和 `steps` 会说明哪个步骤因何失败。Shell 命令处理器在进程启动后即视为成功，结束时的退出码仅供参考。结果不是 `succeeded` 时，命令以退出码 1 结束。不想等待时，加上 `--no-wait`，之后通过 `tasty hook-handler result --run <编号>` 查看结果。

也可通过命令**修改或新建**处理器。未填写的项保持原样，因此，
可保留名称，仅更改执行的操作（引用该处理器的钩子会随之更新）。

```sh
# 仅更改执行的操作 — 先用 get 查看当前操作，再按原有结构传回
tasty hook-handler upsert --id user/my-handler \
  --calls '[{"method":"notification.create","params":{"body":"构建结束"}}]'

# 暂时禁用 / 重新启用
tasty hook-handler upsert --id user/my-handler --disabled true

# 删除自行创建的项
tasty hook-handler remove --id user/my-handler
```

更改先应用于当前运行，命令收到 `~/.tasty/hook-handlers.toml` 的保存结果后结束。保存失败会显示错误，已应用于当前运行的更改仍会保留。但**已创建的 Webhook 地址不会随之更新**——Webhook 保留注册时的操作，要使用新操作，需重新注册该 Webhook。

在**设置** <!-- en: Settings --> › **处理器** <!-- en: Handler --> › **钩子处理器** <!-- en: Hook Handlers --> 标签页中添加和编辑用户处理器。保存时先应用于当前运行，再在后台写入 `~/.tasty/hook-handlers.toml`。保存失败会显示短暂提示和通知，更改可能无法保留到下次启动。也可直接编辑文件（通过 `tasty hook-handler reload` 应用）。保存期间会拒绝 reload，请在完成后重新执行。文件读取或格式出错时，保留原有配置。启动时无法读取配置，会在日志中记录文件名和问题种类，不记录文件内容。

列表的每一行会显示处理器的注册方——Tasty 自身为 `host`，插件为该插件名称，自行创建的为 `you`。只有可删除的行带有垃圾桶，其余行显示锁图标（因为 Tasty 和插件每次启动时都会重新注册自己的处理器）。串联多个内部操作的处理器会在一行中显示操作顺序，点击行末的**编辑** <!-- en: Edit --> 即可就地编辑文本。每行写一个操作，方法名后可按需填写 JSON 参数（以 `#` 开头的行会跳过且不保存）。存在错误行时，输入框下方会显示第一个问题及其行号，修正前无法点击**应用** <!-- en: Apply -->。应用后的内容需点击设置窗口底部的**保存** <!-- en: Save --> 才会写入文件。在输入框内，Ctrl+Enter（macOS 为 Cmd+Enter）用于应用，Esc 用于取消——可在[按键绑定](../customize/keybindings.md)设置的**应用代码输入框** · **取消代码输入框**中修改这两个按键。修改 Tasty 或插件注册的处理器时，会以相同名称保存为自己的配置。如此保存的处理器，此后即使 Tasty 或插件更改默认操作，也**不会随之更新**。这类行的来源旁会显示**已编辑** <!-- en: edited --> 标记，点击第二行的**还原** <!-- en: Revert --> 可恢复默认值。还原需点击**保存**后才会应用；在此之前，会显示**保存时还原** <!-- en: reverts on save --> 标记，并可通过同一位置的**撤销** <!-- en: Undo --> 取消。等待期间，启用开关锁定为默认值，也无法点击**编辑**——若要更改，先点击**撤销**。在终端中，`tasty hook-handler remove --id <id>` 执行相同操作（仅删除自己的配置，并重新应用原处理器）。若包含名称无法用文本表示的操作，则会显示**使用 CLI 编辑** <!-- en: Edit with CLI --> 和复制按钮，代替编辑——通过复制得到的 `tasty hook-handler get --id <id>` 查看内容，再用上述 `tasty hook-handler upsert` 修改。

```toml
[[handler]]
id = "user/notify-fail"
source = "hook"          # hook | webhook | any — 哪些触发源可使用此处理器
[handler.action]
kind = "shell_command"
command = "tasty"
args = ["notify", "命令失败", "--title", "hook"]
```

设为 `kind = "ipc_sequence"` 时，执行 Tasty 内部操作列表（`calls = [{ method = "...", params = {} }]`），代替 Shell。TOML 没有 null，因此，params 中需要 null 值时，使用 JSON 字符串代替 `params`，例如 `params_json = '{"a":null}'`。通过 `tasty hook-handler upsert` 保存时，会自动写为此格式。

钩子自动执行失败时，会在通知列表中留下记录。因处理器已删除或无法启动命令而完全未执行时，记为**错误**；操作列表仅部分步骤失败，或未及时收到响应、无法确定结果时，记为**警告**。Surface 钩子的通知附属于该钩子所在的 Surface。Shell 命令以非 0 退出码结束不视为失败。相同失败在短时间内反复发生时，每 10 秒仅记录一次。

## 通知

### 发送

```sh
tasty notify "构建完成"                    # 标题默认为 "通知"
tasty notify "3 个测试失败" --title "cargo test" --level error --surface 42
tasty list notifications
```

`list notifications` 按创建时间从新到旧返回所有窗口中最近的 50 条通知。同一次运行中，通知 ID 在各窗口间也不会重复。短时间内的通知合并到现有条目时，该条目的顺序保持不变。屏幕上的通知面板显示所属窗口的通知。统计和显式标为已读的命令可针对所有窗口。


终端程序发送的通知序列（OSC 9 / 99 / 777）和响铃也会归入同类通知。

严重失败使用 `--level error`，非致命问题使用 `--level warning`，信息使用 `--level info`。省略时为 `info`。不同级别不会合并，已读条目合并新内容后会重新变为未读。

```sh
tasty notification counts
tasty notification counts --workspace 12
tasty notification read 7
tasty notification read --all --workspace 12
```

统计会计算所有保留的未读通知，不受列表最近 50 条的限制。单独标为已读时，使用 `list notifications` 显示的通知 ID。不带工作区筛选执行 `read --all` 时，针对所有窗口。读完同一 Surface 的最后一条未读通知后，也会清除对应的注意标记，但硬占用期间会保留。通知数量和 Surface 数量分别统计。

通过 `notify --workspace 12` 发送与 Surface 无关的通知。此调用不会添加 Surface 注意标记。明确指定工作区时，不会自动添加环境中的 Surface ID。

### 显示位置

- **侧边栏通知摘要**——工具按钮正上方显示未读错误（红色）、警告（黄色）、信息（蓝色）的数量。数量为 0 的级别隐藏，超过 99 条时显示为 `99+`。展开侧边栏后，还会显示最新未读通知的标题。点击摘要可打开通知面板。浅色主题的警告徽章使用浅黄色背景和深色数字。列表中的警告图标也使用与背景区分的深色，标为已读后仍保持相同颜色。
- **通知面板**——点击摘要或按 `Ctrl+Shift+I` 打开。按从新到旧的顺序显示级别、标题、正文、来源和经过时间，仅打开或关闭面板不会标为已读。点击行或**展开** <!-- en: More --> 会展开全文，并将该通知标为已读。可用勾选按钮处理单条通知，或用**全部标为已读** <!-- en: Mark all read --> 处理所属窗口的通知。**跳转** <!-- en: Jump --> 会前往发送通知的 Surface 或工作区。来源关闭后仍保留记录，跳转按钮禁用。可在标题栏切换全屏。新通知到达时，不会自动打开面板，也不会将正在查看的列表滚动到顶部。现有通知合并内容、正文变长时，也会保留阅读位置。
- **Surface 边框**——发生通知的 Surface 显示蓝色边框。Tasty 窗口处于活动状态时，将焦点移至该 Surface 即会消失。使用其他应用期间会保留，返回窗口后消失。
- **侧边栏徽章**——包含需注意 Surface 的工作区行会显示数量徽章。
- **声音**——在设置中启用后，每条通知播放一次系统提示音。

不会发送到 OS 通知中心（系统通知）。若要在使用其他应用期间也能察觉，请启用声音。

### 设置

**设置** › **常规** › **通知** <!-- en: Notifications --> 标签页，或 `~/.tasty/config.toml`：

```toml
[notification]
enabled = true        # 启用通知
sound = false         # 声音
coalesce_ms = 500     # 通知合并间隔 (ms) — 将同一来源的连续通知合并为一条

[general]
bell_notification = true   # 显示响铃通知（关闭时仅抑制响铃短暂提示，bell 钩子仍会触发）
```

### 等待人工决定（批准）

任务继续前需要用户判断时，发送批准请求。智能体可在发送请求后等待响应。

```sh
ID=$(tasty approval request --title "执行 prod DB 迁移？" --severity danger \
      --choices "approve:执行,deny:中止:1" --timeout-ms 600000 | jq -r .id)
tasty approval await --id "$ID"            # 等待响应，以 JSON 输出结果
```

- 会显示弹窗，并同时发送通知。用户可点击弹窗按钮、在弹窗中按数字键 `1`~`9`（按选项顺序），或通过 `tasty approval respond --id <ID> --choice approve` 响应。
- 弹窗不会获取键盘焦点。原本在终端或文档中输入的文字仍会输入到原处。若要用数字键选择，先点击弹窗标题或空白处。按钮可直接点击。正在 Markdown、HTML 文档中输入时，该文档可能遮住与弹窗重叠的部分。也可通过同时发送的通知查看请求。
- 在评论框中输入时，数字会作为评论文字输入，不会选择选项。写完评论后若要用数字键选择，按 Tab 离开评论框，或点击弹窗空白处。
- `--severity info` 仅发送通知，不显示弹窗；`warn`/`danger` 显示弹窗并发送通知。`danger` 必须由用户直接响应。
- 弹窗不能用 Esc 关闭（防止绕过）。通过 `tasty approval list` / `get` / `history` 查询。
- `approval await` 仅供用户使用。通过会话令牌（`TASTY_SESSION_TOKEN`）连接的智能体无法调用，请通过 `tasty approval get --id "$ID"` 查看状态（需要 `approval` 权限）。
- `--metadata` 的 `kind` 不能使用 `capability_elevation`。该值专用于智能体权限请求，使用时会拒绝请求。请通过 `tasty plugin request-permission` 请求智能体权限。
- 请求绑定到工作区。指定 `--workspace` 时绑定到该工作区；仅指定 `--surface` 时绑定到该终端所在的工作区；两者均未指定时，绑定到当前查看的工作区（也接受旧写法 `--workspace-id`、`--surface-id`）。智能体发送请求时，通过 `--surface "$TASTY_SURFACE_ID"` 指定自己的终端较安全——即使用户正在查看其他工作区，也会绑定到同一位置。

## Webhook（外部 → Tasty）

让 CI 或其他服务发送 HTTP 请求，触发 Tasty 内的操作。Tasty 为 Webhook 开放一个端口，并为每个 Webhook 分配难以猜测的 URL。

Webhook 使用难以猜测的 URL 和可选的固定令牌（`--auth-*`）。**不支持 HMAC 签名验证**，因此不会检查外部服务发送的签名头。**未配置认证时，任何能访问 URL 的人都可请求执行操作。**注册时请同时指定所需的认证选项。

### 端口和外部接收

```sh
tasty webhook port                  # 正在运行的监听器地址、端口及端口选择方式
tasty webhook port 28500            # 下次启动起使用此端口
tasty webhook port --unset          # 删除已保存的端口，下次启动起自动选择空闲端口
tasty webhook allow-external on     # 下次启动起也接收其他计算机的调用（用 off 还原）
tasty webhook allow-external        # 查看已保存的值和正在运行的监听器实际开放的地址
tasty --webhook-port 28500          # 仅本次运行使用此端口启动
```

- **未指定端口时**，从 `28429` 开始逐个递增，使用空闲端口（最多 64 个，至 `28492`）。即使其他 Tasty 已占用 `28429`，Webhook 也可运行。全部被占用时，会在通知列表留下警告，并在不启用 Webhook 的情况下运行。
- **已指定端口时**（`--webhook-port` 或 `tasty webhook port <N>`，同时指定时优先使用 `--webhook-port`），仅使用该端口。若被其他程序占用，不会切换到其他端口，而是**在不启用 Webhook 的情况下启动**。终端可正常使用，通知列表会留下一条包含端口、原因和解决方法的警告。此时 Webhook 地址（包括已保存的 `--persistent` Webhook）不会响应，但注册仍会保留，修正端口并重新启动后，可继续使用相同注册接收请求。地址中的端口会变为本次运行开放的端口，因此请通过 `tasty webhook list` 查看实际地址。`tasty webhook port` 会显示 `bound: false`，并在 `unavailable` 中显示无法开放的端口和原因。请使用其他端口启动；若为已保存的端口，执行 `tasty webhook port --unset`（删除）或 `tasty webhook port <空闲端口>`（更改）后重新启动。即使 Tasty 未运行，这两条命令也会直接修改 `~/.tasty/webhooks.toml`，并告知已如此处理。Tasty 正在运行时，从下次启动起生效。
- `tasty webhook config --port <N>` 为旧名称，已不再推荐使用（deprecated）。目前仍与 `tasty webhook port <N>` 完全相同。
- 端口因占用而不再使用 `28429`，且存在通过 `--persistent` 保存的 Webhook 时，会在通知列表留下警告。已保存 Webhook 的地址端口也会改变，请通过 `tasty webhook list` 查看新 URL。地址不能改变时，请指定端口。
- Tasty 已运行时，若使用不同的 `--webhook-port` 再次启动，不会转交给正在运行的 Tasty，而是显示提示后结束。端口相同时，会照常在正在运行的 Tasty 中打开新窗口。
- 旧版本自动写入的 `port = 28429` 会在首次运行时删除，改为自动选择。手动指定的其他端口保持不变。
- **默认情况下，Webhook 服务器仅接收来自本机（`127.0.0.1`）的调用。**若其他计算机或 CI 需要直接调用，启用**设置 → 常规 → 接收其他计算机的 Webhook 调用**，或执行 `tasty webhook allow-external on` 后重新启动 Tasty。在 `~/.tasty/config.toml` 的 `[webhook]` 下写入 `allow_external = true` 效果相同。启用后，会在所有 IPv4 网络接口（`0.0.0.0`）上接收，因此主机防火墙允许时，同一网络（公司内网、公共 Wi-Fi 等）无需路由器转发即可访问。请检查防火墙和认证设置。HTTPS 由前置反向代理处理。

### 注册

```sh
# 关联已注册的处理器
tasty webhook register --method POST --handler host/webhook-notify --persistent

# 定义内联操作 — 通过 ${body.x} 引用正文中的值
tasty webhook register --method POST \
  --sequence '[{"method":"notification.create","params":{"title":"CI","body":"${body.status}"}}]' \
  --ttl-secs 3600 \
  --auth-location header --auth-key X-Token --auth-token s3cret
```

注册后会输出形如 `http://127.0.0.1:<端口>/<16 位 id>` 的 URL。端口为本次运行实际开放的端口。若已启用外部接收，从外部调用时将主机部分替换为实际地址——此处的写法是为了便于就地直接运行 `curl`。请原样使用返回的路径。不要添加 `/webhook/` 前缀。

| 选项 | 含义 |
|---|---|
| `--method <M>` | 允许的 HTTP 方法（可重复指定，默认为 POST） |
| `--handler <id>` 或 `--sequence <json>` | 必须二选一 |
| `--persistent` | 重新启动后仍保留（默认在重新启动时消失）。若同时设置 `--auth-token`，该令牌也会以明文保存在 `~/.tasty/webhooks.toml` 中 |
| `--ttl-secs <秒>` / `--count <N>` | 时间限制 / **已接收**调用次数限制（二选一）。认证未通过的请求（`401`）和不允许的方法（`405`）不会扣减次数 |
| `--auth-location query\|bearer\|body\|header` + `--auth-token` (+ `--auth-key`) | 可选认证。未设置则无认证 |

运行期间查询或更改端口时，会在文件处理完成后收到结果。无法保存时，保留原内容并返回错误，正在运行的监听器地址不会改变。

持久 Webhook 的注册和注销会在文件保存完成后返回结果。保存失败时，保留原注册。等待保存期间，可继续执行其他 Tasty 操作。

端口配置和持久注册保存在同一文件中，但不会清除彼此的内容。无法读取或解析文件时，保留原文件并拒绝保存。手动编辑时的注释和空白可能在下次保存时改变。

同时省略 `--ttl-secs` 和 `--count` 时，调用不受限制。`--persistent` 可与任一种限制一起使用，重新启动时会恢复期限或次数尚有剩余的注册。

可通过 `tasty hook-handler list` 查看可用的处理器 id。`--sequence` 为按顺序填写 Tasty 内部操作（发送通知、发送文本等）的 JSON 列表。若不是有效 JSON，则不注册任何内容，并以说明原因的错误结束（退出码 1）。

### 响应和管理

调用服务会收到状态码和固定响应文本。响应不包含实际操作的结果。

**`200` 表示“已接收”，不表示“已执行”。**响应在操作开始前确定，因此即使操作完全失败，调用方仍会收到 `200`。多步骤的 `--sequence` 中，即使一个步骤失败，后续步骤也会继续执行，可能最终仅应用一半。失败详情会记录在 Tasty 的通知列表中（无步骤成功时为错误，仅部分失败时为警告）。若 CI 根据状态码决定是否重试，请注意不要将 `200` 计为“成功”。

| 状态码 | 含义 |
|---|---|
| 200 `received` | 已接收（操作在后台执行） |
| 401 `unauthorized` | 认证失败（重复发生会被 429 阻断） |
| 404 | URL 不存在 |
| 405 | 不允许的方法 |
| 410 | 期限或次数已耗尽 |
| 413 | 正文超过单次请求的大小上限（默认 1 MiB） |
| 429 | 同一来源在 10 秒内失败（`401`、`404`、`405`、`413`）20 次及以上，正在阻断 60 秒 |
| 503 `unavailable` | 无法接收请求或无法确定保存结果。不执行操作 |

正文大小限制先于认证应用。分块传输的正文即使包含无效 UTF-8 字节，也适用相同的大小限制。即使没有令牌，只要正文超过上限，也会收到 `413 payload too large`，且不执行操作。此上限限制待处理正文的大小。413 响应带有 `Connection: close`，服务器不会接收剩余正文，而是关闭连接。被阻断（`429`）的请求也如此。无法通过同一连接发送下一个请求，请建立新连接。若当时仍在发送正文，连接可能以重置（reset）方式断开。此功能不限制总内存或并发连接数。

确认次数或到期变更保存失败时，会留下警告，并继续按原方式接收和执行操作。此时，未能保存的变更可能在重新启动后回退。拒绝接收或无法确定保存结果时，会发送 `503`，且不执行操作。结果变得不明确后，在重新启动 Tasty 并恢复已保存的注册之前，会拒绝新变更。

阻断状态仅保存在内存中——重新启动 Tasty 后，剩余阻断时间消失，该来源重新从头计算。

```sh
tasty webhook list
tasty webhook info --id <ID>
tasty webhook unregister --id <ID>
tasty webhook sweep                 # 批量清理已到期的 Webhook
```

Webhook 无法直接执行 Shell 命令（仅可执行 Tasty 内部操作）。需要 Shell 时，可按 Webhook → 通知 → Surface 钩子的方式串联。

## 组合示例：长时间构建结束时通知

```sh
tasty set hook --surface 42 --event command-completed --once \
  --command 'if [ "$TASTY_HOOK_EXIT_CODE" = 0 ]; then tasty notify "构建成功" --title build; else tasty notify "构建失败 ($TASTY_HOOK_EXIT_CODE)" --title build; fi'
tasty send text "cargo build --release\r" --surface 42
```

`command-completed` 匹配所有退出码；像 `command-completed:0` 一样附加一个整数后，仅匹配该退出码。实际退出码通过 `TASTY_HOOK_EXIT_CODE` 环境变量传入钩子命令。

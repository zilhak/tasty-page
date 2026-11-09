<!-- source-hash: c5535ad51fa9 -->
# CLI 命令参考

按用途说明入门内容之外的命令，包括指定读取位置的 `read since-mark`、Surface 状态、消息队列和共享记忆。完整参数和选项可通过 `tasty help` 查看。

## 查找命令

```sh
tasty help                    # 按用途分组的命令列表和首次任务操作顺序
tasty -a                      # 所有命令路径及简短说明
tasty help read since-mark    # 单个命令的详细说明 (= tasty read since-mark --help)
```

`-h` 显示简短说明，`--help` 和 `tasty help <命令>` 显示详细说明。选择目标的选项以目标种类命名，如 `--surface` · `--pane` · `--workspace`。旧写法（`--workspace-id`、`--target-surface` 等）仍可作为别名使用，并在帮助中一并显示。

## 多个智能体读取同一终端时：保留位置并读取

每个 Surface 只有一个标记，因此多个智能体查看同一终端时，一个智能体的 `set mark` 会移动其他智能体的读取位置。要避免相互干扰，需**各自保存下次读取的位置**并使用。

```sh
tasty read since-mark --surface 42 --strip-ansi --max-bytes 65536
# 保存响应中的 next_cursor 和 stream，并在下次调用时传入
tasty read since-mark --surface 42 --strip-ansi --cursor 81920 --stream 1a2b-7
```

- 响应（JSON）包含 `next_cursor`（下次读取的位置）· `stream`（该位置所属终端的标识）· `skipped`（期间被挤出缓冲区而丢失的字节数）。**续读始终使用 `next_cursor`**——按 `text` 的长度计算会因移除的颜色代码而产生偏差。
- Tasty 不保存每个接收方的读取位置。使用各自传入的位置，不会更改其他接收方的位置或共用标记。
- `--cursor` 只能与 `--stream` 一起使用。如果 Surface 关闭后以相同编号重新打开，或终端重新启动，旧位置不会被应用，请求会被拒绝并返回错误——此时不带位置读取一次，重新开始。
- `skipped` 不为 0 时，表示相应数量的字节在读取前已丢失。输出缓冲区仅保留最近的 1 MiB。
- 可用 `--max-bytes` 减少单次接收量。剩余内容从 `next_cursor` 继续读取。`0` 按 1 字节处理，并非“无限制”——要无限制接收，省略 `--max-bytes`。
- 对不识别这些参数的旧版 Tasty，**不会发送请求。**此时命令向 stderr 写入一行 `{"error":{"kind":"unsupported_capability",…,"sent":false}}`，并以退出码 1 结束。由于未发送任何内容，更新 Tasty 后直接再次调用即可。

<a id="查看-surface"></a>

## 检查 Surface 状态

```sh
tasty surface cursor-position --surface 42     # 光标所在的行和列
tasty surface foreground-process --surface 42  # 当前前台运行的程序 (is_shell 为 true 表示是 Shell，处于空闲状态)
tasty surface mouse-tracking --surface 42      # 内部程序是否捕获鼠标，以及 tasty 是否遵循该设置
tasty surface locate --surface 42              # 此 Surface 所属的窗格，以及是否仍然存在
tasty surface respawn-terminal --surface 42    # 保持位置，仅重新启动 Shell
tasty surface fire-hook --surface 42 --event process-exit    # 直接触发钩子
tasty surface fire-hook --surface 42 --event idle-timeout:300 # 也有附带秒数的事件
```

`respawn-terminal` 即使在新 Shell 已显示后，也要确认旧 Shell 退出才会响应。
若 5 秒内未能确认退出，新 Shell 仍可使用，但响应为需要恢复的错误（`-32068`）。
收到此错误后，使用相同的幂等键（IPC 请求的 `idempotency_key`）重新发送，由于 Shell 替换已完成，会收到成功结果。
创建终端、工作区或标签页的命令若在启动 Shell 时失败，且无法确定实际运行了什么，会立即返回需要恢复的错误（`-32068`），不再等待。使用相同的幂等键（IPC 请求的 `idempotency_key`）重新发送也不会再次执行，而是返回相同错误。
在 macOS · Linux 上，若在 Shell 进程创建前失败，例如配置的 Shell 文件没有执行权限，或路径下没有文件且找不到替代 Shell，则返回普通错误。在 Windows 上，如果配置的 Shell 不是 Git Bash、路径下没有文件，或设置为空且默认安装位置也未找到 Git Bash，创建终端的命令会在 Shell 进程创建前返回普通错误，不会换用其他 Shell。使用相同幂等键重新发送会返回相同失败；修正 Shell 配置后，使用新幂等键发送会再次执行。

## 为子智能体授予权限

```sh
tasty session issue --agent-id build-bot --permission surface.read --permission terminal.write
tasty session list
tasty session revoke --token <令牌>
```

子智能体将签发的令牌用作 `TASTY_SESSION_TOKEN` 时，发往 Tasty 的请求会按该令牌的权限检查。
会话令牌用于区分请求来自哪个智能体，并防止智能体误操作，不构成安全边界。不带令牌调用的命令按用户命令处理。

准备远程连接时，可使用会话令牌运行 `tasty remote attach --into-gui` 和 `tasty remote refusals`，无需额外权限。通过 `tasty list workspaces` 查看连接结果列表需要 `surface.read` 权限。命令形式和 JSON 结果参见[继续远程工作](../remote/attach.md)。

插件添加的命令（`tasty markdown recent` · `tasty codex spawn` 等）也需要权限。
对于 `tasty <命令> …`，请添加 `--permission ipc.invoke:<命令>`——`tasty markdown …` 对应
`ipc.invoke:markdown`，命令名称中的 `-` 要替换为 `_`。未添加权限就调用时，请求会被拒绝，并向用户发送权限批准请求。
通过 `tasty claude spawn` 启动的 Claude 已获得 `tasty claude …` · `tasty codex …` 权限。

## 发送通知

在耗时任务结束时通知用户。通知会累积在通知面板中，并通过 Surface 边框和侧边栏徽标显示。不会发送到操作系统通知中心。

```sh
tasty notify "构建完成" --title "cargo"
tasty list notifications
```

通知的详细行为和自动执行（钩子）参见[钩子 · 通知 · Webhook](hooks-notifications.md)。

## 在 Surface 上留下备注（元数据）

可为每个 Surface 附加键值对。用于多个智能体标记角色或交换状态。

```sh
tasty surface-meta set --key role --value builder --surface 42
tasty surface-meta get --key role --surface 42
tasty surface-meta list --surface 42
tasty surface-meta unset --key role --surface 42
```

只能为打开的 Surface 附加备注。传入已关闭的 Surface ID 会被拒绝并返回错误；关闭 Surface 时，其备注也会一并删除。

## 在 Surface 之间收发消息（队列）

用于在 Surface 之间传递消息的队列，不影响终端输入。

```sh
tasty send queue --to 42 "测试完成，请检查结果"
tasty list queue --surface 42            # 待处理数量和预览
tasty read queue --surface 42            # 取出所有积累的消息
tasty read queue --surface 42 --peek     # 查看但不取出
tasty read queue --surface 42 --clear    # 全部清空
```

<a id="将子终端作为智能体运行"></a>

## 将任务交给多个终端

在工作区中打开更多终端，执行命令、发送输入并查看正在进行的任务。包括 Claude 和 Codex 在内，**普通程序也**可用相同方式运行。Claude 和 Codex 的[专用命令](claude-codex.md)还提供会话管理功能。

```sh
tasty terminal spawn --workspace build --command "cargo watch -x test" --cwd ~/proj --role worker
tasty terminal children                        # 当前终端下的子终端列表
tasty terminal tell "y" --surface 57           # 向子终端发送输入 (保留换行，自动提交)
tasty terminal broadcast $'git pull\r' --role worker # 发给所有相同角色的子终端 (末尾必须有实际 CR 才会提交)
tasty terminal kill --child 1                   # 按索引终止子终端
```

`tasty terminal children` 默认输出父 ID 表。接受 `--format table|json`，默认值为 `table`。其他值会报错。要在脚本中按 JSON 读取输出，添加 `--format json`。在旧版本中将默认输出解析为 JSON 的脚本也必须添加此选项。

表格使用 Markdown 风格的管道符（`|`）分隔列，列顺序为 `id`、`parents`、`nickname`、`state`、`cwd`、`last_report_at`、`index`、`confidence`、`evidence`。`id` 是子 Surface ID，`index` 是传给 `kill --child` 和 `respawn --child` 的编号。存在多个父方时，`parents` 用逗号连接。如下方示例所示，通过 `--parent-external` 指定的外部父方会在 `parents` 中显示其键。`last_report_at` 的显示格式如 `2026-11-09T12:19:12Z`。没有子项时，仅输出两行表头，退出码为 0。`tasty claude children` 和 `tasty codex children` 输出相同的列。

`spawn` 在终端准备完成后响应，不等待智能体任务结束。智能体状态传递和父方接收准备遵循 [Claude·Codex 集成](claude-codex.md)中的说明。仅创建普通程序不保证智能体结果传递。
无需单独运行等待命令。使用 `--role` 指定角色后，可通过 `broadcast` 批量发送。

先保存子终端编号预留，再准备新终端。若预留保存失败，会返回错误，不创建终端，也不发送 command。不会覆盖损坏或无法读取的关系信息。

`adopt` 会同时保存编号分配和关系注册。`adopt` · `release` · `set-state` 在确认保存结果后响应。无法确定保存结果时，不会报告成功，也不会自动重新执行同一预留。若保存期间目标关闭或发生变化，会报告实时应用失败。`spawn --command` 的输入也只在子终端关系保存后发送。

若 `terminal spawn` 在准备阶段失败，不会发送 command，并会清理本次调用创建的终端。已有终端会保留。

带 `--command` 的 `spawn` 在新终端显示后输入 command，发送 Enter，然后响应。如果期间目标终端换成其他 Shell，或被远程附加占用，则不发送 Enter，返回需要恢复的错误（`-32068`），已创建的终端会保留。在 command 输入与 Enter 之间直接向该终端键入的按键，可能附加在 command 后一起执行（与 `terminal tell` 相同）。

子终端的父方通常是执行命令的终端。Claude·Codex 专用命令会自动确定父方，无需另行指定。如果脚本将 Tasty 外部的目标（例如其他进程中正在进行的智能体对话）作为父方，请使用 `--parent-external <键>` 代替 `--surface`。键为自行指定的字符串（不含空白，最多 256 字节），相同键会将子终端归到同一父方。`spawn` · `children` · `kill` · `respawn` · `broadcast` · `release` 接受此选项。打开多个窗口时，还需提供 `--workspace`。

```sh
tasty terminal spawn --workspace build --parent-external review-bot --command "make lint"
tasty terminal children --parent-external review-bot --workspace build
tasty terminal release --parent-external review-bot --workspace build --child 0
```

## 无界面 PTY

在真实 PTY（伪终端）上运行程序，不创建标签页或画面。用于从脚本运行需要 TTY 的命令，
而不在屏幕上创建标签页。通过 `spawn` 返回的 id 发送输入并读取画面。

```sh
tasty pty spawn --cwd ~/proj -- python3         # 在 PTY 上启动命令并获取 id
tasty pty write --id 2147483648 $'print(1+1)\n' # 发送到标准输入 (换行即提交)
tasty pty read --id 2147483648 --lines 20      # 当前画面的最后 20 行
tasty pty state --id 2147483648                 # 立即检查是否已退出 (不等待)
tasty pty list                                  # 正在运行的 PTY 列表
tasty pty kill --id 2147483648                   # 终止
```

检查运行状态以及将运行中的任务移到标签页的方法，参见[将后台任务移入标签页](background-tasks.md)。

## 智能体共享的记忆

同一 Tasty 中的多个智能体用于交换值的键值存储。可选择存储范围（全局 · Surface · 工作区 ·
窗口 · 账户），并设置过期时间（TTL）或防止覆盖（CAS）。

```sh
tasty memory put --workspace 7 --key build.status --value running --ttl 600
tasty memory get --workspace 7 --key build.status
tasty memory list --workspace 7 --prefix build.
tasty memory delete --workspace 7 --key build.status
```

通过 `--global` · `--surface 3` · `--window 42` · `--account me` 切换范围。值为 JSON 时，
按 JSON 存储，否则按字符串存储。

超过 `--ttl` 的键等同于不存在的键。其他智能体也可在该键下存入新值，version 从 1
重新开始。过期值不计入容量上限，Tasty 每 10 分钟从磁盘删除一次。

只能在打开的 Surface 的 `--surface` 范围内存储。传入已关闭的 Surface ID 会被拒绝并返回错误。
`tasty memory import` 也遵循相同规则。文件中只要有一个条目属于已关闭的 Surface 范围，就不会导入任何内容，并返回错误。
关闭 Surface 时，该范围内的值也会一并删除。以前关闭的 Surface 范围内残留的值，
可通过 `tasty memory list --surface <ID>` 查看，并用 `tasty memory delete` 删除。

Tasty 启动时若无法打开记忆文件（`~/.tasty/memory.db`）——文件损坏或没有
权限——不会停止，而是使用**临时记忆**继续运行。期间存储的值会在 Tasty
重新启动后消失。不仅是记忆，存储在同一文件中的智能体任务、信号量等
协调机制、批准、Surface 元数据、遥测和会话也一样。此状态下，这些存储
结果会附带 `"durable": false`，
`tasty list pressure` 的 `db_pragmas.memory_db` 会显示 `degraded: true` 及原因（`init_failure`）。
通知列表中也会留下一条说明原因和影响的警告通知。

<a id="从输出中提取信号-观察者"></a>

## 从输出中收集所需信息（观察者）

从终端输出中查找并记录路径、URL、退出码、提示符边界等条目。无需持续盯着屏幕，即可在脚本中使用这些信息。

```sh
tasty output observe start --surface 42 --parsers exit_code,url --sink file
tasty output observe list                        # 当前运行的观察者列表
tasty output observe info --observer 1           # 单个观察者的状态和收集数量
tasty output observe stop --observer 1
```

`--sink memory` 将内容收集到内存环形缓冲区，`--sink file` 收集到文件。留空 `--parsers` 时，默认
解析器（路径 · URL · 提示符边界 · 退出码）会全部启用。

<a id="测量智能体活动"></a>

## 查看智能体用量

多个智能体以数值记录各自活动（令牌数、调用次数等），并以总计、时间序列和
排名查看。适合一并查看多个智能体的用量和活动。

```sh
tasty telemetry record --metric tokens --value 1200 --tags '{"model":"opus"}'
tasty telemetry summary --metric tokens           # 总计和条数
tasty telemetry top --by agent --metric tokens    # 按智能体排名
tasty telemetry timeseries --metric tokens --window 1h
```

省略 `record` 的 `--agent` 时，使用 Tasty 识别的调用方 ID 记录。使用会话令牌的智能体使用该会话的 ID。不带令牌的本地调用使用该 Shell 的 `TASTY_AGENT_ID` 记录；值不存在，或不是由英文字母、数字、`_`、`-` 组成且不超过 64 个字符时，记为 `_host`。此值仅是调用方自行声明的名称，不影响权限。要保持顺序
一次写入多个值，使用 `tasty telemetry record-batch`。

## 其他查询和设置

智能体偶尔会用到的命令。完整列表可通过 `tasty <命令> --help` 查看。

```sh
tasty list pressure                    # 响应请求时各处的耗时 (阅读方法：响应延迟与连接诊断)
tasty list theme                       # 当前应用的主题快照 (颜色、字号、界面缩放比例)
tasty list recent --kind markdown      # 最近以该种类打开的文件列表
tasty set cwd --surface 42 --path /tmp # 更改远程 Surface 报告的工作目录
tasty set url --surface 42 --url URL   # 更改 WebView Surface 的地址 (--label 名称：页面被遮挡时显示的名称)
tasty surface html-script --surface 42 # HTML Surface 的脚本、远程内容检测、允许及提示状态 (仅查询)
tasty surface html-script-allow --surface 42 --url <url> --fingerprint <hex>  # 允许所查询文档的脚本并重新加载。文档已更改则拒绝。焦点不变
tasty surface html-remote-allow --surface 42 --url <url> --fingerprint <hex>  # 仅允许所查询文档的远程内容 (网络上的样式表、图片、字体、框架、脚本) 并重新加载。与脚本允许设置独立。焦点不变
tasty surface html-nav --surface 42    # HTML Surface 显示的文档地址及能否后退、前进 (仅查询)
tasty surface html-back --surface 42   # 使 HTML Surface 后退 (html-forward：前进，html-reload：刷新)。焦点不变，通过 html-nav 查看结果
tasty hook-handler dispatch --id user/my-handler  # 直接执行钩子处理器并等待最终结果
tasty hook-handler result --run 7       # 按 dispatch 返回的 run 编号再次查看结果
tasty file-handler dispatch 文件路径     # 通过与在文件浏览器中双击相同的路径打开文件 (等待结果)
tasty file-handler result --run 7       # 按 dispatch 返回的 run 编号再次查看结果
tasty file-handler reload               # 重新读取文件处理器配置文件
tasty file-handler detectors            # 查看当前文件格式检测规则的合并状态
```

`set cwd` 和 `set url` 分别仅对远程 Surface 和 WebView Surface 生效。对普通终端 Surface 使用时，会返回不支持该目标的错误。

`hook-handler dispatch` 输出两行。第一行是接受请求的响应，包含 `run` 编号。第二行是等待后的最终结果。结果的 `state` 为 `succeeded` 时，以退出码 0 结束；为 `partial` · `failed` · `unknown`，或等待期间未完成（`running`）时，以退出码 1 结束。即使 Tasty 不响应结果查询，也会在等待上限到达时停止，此时第二行附带 `"timed_out": true`。失败的步骤和原因显示在 `result` 和 `steps` 中。接受前被拒绝的请求（处理器不存在、处理器已禁用、队列已满等）不输出第一行，而是输出错误并以退出码 1 结束。添加 `--no-wait` 时，仅输出第一行并以退出码 0 结束，之后可通过 `hook-handler result --run <编号>` 查看结果。等待结果时会发送多个请求，因此不接受根选项 `--response-timeout-ms`。添加此选项时，不发送任何内容，并以使用错误结束（退出码 2）。添加 `--no-wait` 时只有一个请求，此选项会应用于该请求。Shell 中设置的会话令牌（`TASTY_SESSION_TOKEN`）和智能体 ID（`TASTY_AGENT_ID`）也会原样附带在结果查询请求中。

`file-handler dispatch` 只接受文件路径。传入 `https://…` 等网址会返回错误。此命令打开的文件只会作为新标签页追加到后面，不会切换用户正在查看的标签页。若没有能打开此格式的处理器，不会在用户屏幕上显示**打开文件的方式…** <!-- en: Open file with… -->，也不会打开文件。此命令与 `hook-handler dispatch` 一样输出两行。第一行是接受请求的响应（包含 `run` 编号），第二行是最终结果。打开成功时，`state` 为 `succeeded`，通过 `surface_id` 返回新标签页，并以退出码 0 结束。若没有可用的打开处理器或处理器失败，`state` 为 `failed`，`result` 中显示原因，并以退出码 1 结束。基于远程工作区的标签页打开时，会等待远程 Tasty 实际打开。远程无法打开时，会返回 `failed` 和远程报告的原因。若收到远程响应前连接断开，则无法确定是否已打开，因此 `state` 为 `unknown`，退出码为 1。30 秒内未收到结果时，退出码也为 1。添加 `--no-wait` 时，仅输出第一行，之后可通过 `file-handler result --run <编号>` 查看结果。等待结果时不接受根选项 `--response-timeout-ms`（退出码 2）。在服务器上以无 GUI 方式运行的无界面构建无法打开文件，因此不会对该命令响应已接受请求，而是返回此构建不支持该操作的错误。

`file-handler reload` 的响应包含 `rejected` 列表。列表包含配置文件中当前未应用条目的 `id` 和原因（`reason`）；全部应用时为空列表。原因有三种。

- `missing_owner_prefix`——`id` 前未添加 `user/` 等所有者部分（应写为 `user/名称`）。此条目会被丢弃。
- `missing_detector_or_action`——自行创建的 `user/…` 条目未指定要处理的文件（`detector`）或执行的操作（`action`）。此条目会被丢弃。
- `target_not_contributed`——条目用于修改内置处理器或插件处理器，但该目标当前不存在。原因是插件已禁用或 `id` 错误。条目会保留，启用插件后会按原样应用。启用后若仍在列表中，请检查 `id`。

`file-handler detectors` 为每个文件格式检测规则（detector）同时显示当前生效值（显示名称、图标、是否启用、规则）以及生成这些值的各来源原始内容（`contributions`）。来源包括 `host`（内置）· `plugin:<id>` · `user`（配置文件）。用于检查配置文件中的值是否实际生效——`contributions` 按安装顺序列出，要判断实际应用了哪个值，请查看上方的生效值。

`list info` 中的工作区数量和活动位置属于所查询的窗口，可通过一并返回的工作区 ID 确认归属。所有工作区可通过 `list workspaces` 查看，各窗口状态可通过 `list windows` 查看。

## 相关阅读

- [使用 tasty CLI 操作终端](cli.md)——首次使用顺序和基本模式。
- [CLI 响应延迟与连接诊断](../help/cli-diagnostics.md)——`tasty list pressure` 的阅读方法及各错误码的处理方式。
- [将后台任务移入标签页](background-tasks.md) · [配合 Claude·Codex 使用](claude-codex.md) · [管理任务顺序](tasks.md) · [钩子 · 通知 · Webhook](hooks-notifications.md)

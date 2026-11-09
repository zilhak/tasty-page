<!-- source-hash: ee2d235f18db -->
# 配合 Claude 和 Codex 使用

在 Tasty 终端中运行 Claude Code 和 Codex CLI 并查看状态。两个 CLI 需要单独安装。要将任务分配给多个智能体，请同时配置钩子和父智能体的结果接收路径。

子智能体结束响应与任务成功不同。结果接收路径取决于父智能体是 Claude Code 还是 Codex。钩子传递状态，父智能体的接收路径将状态或结果引用传递到对话中。读取结果，并与实际变更和执行结果核对。

## 快速开始

1. 安装钩子：`tasty claude install`、`tasty codex install`（[安装钩子](#1-安装钩子仅首次)）。
2. 启动智能体：`tasty claude launch --workspace myproj --directory ~/proj`（[启动](#2-启动)）。
3. 在该 Claude Code 会话中将任务交给其他智能体：`tasty claude spawn --workspace workers --cwd ~/proj --prompt "运行 cargo test 并报告失败原因"`（[分配任务](#3-将任务交给其他智能体spawn--tell)）。
4. 查看状态和结果：用 `tasty claude children` 查看子智能体列表和状态，按[接收完成通知](#4-接收完成通知)中的方法接收完成通知。

`tasty claude help` · `tasty codex help` 最后的“内部集成”分组是钩子调用的命令，无需手动输入。批准策略、权限模式、会话 Reboot 和会话配置档按需参阅后续章节。

## 1. 安装钩子（仅首次）

要让 Tasty 获取智能体的状态（工作中／空闲／需要输入／已退出），各 CLI 的钩子配置中必须包含 Tasty 条目。

```sh
tasty claude install    # 安装 Tasty 钩子和完成通知 mod
tasty codex install     # 在 ~/.codex/config.toml 的 [hooks] 中添加 Tasty 条目
```

- 已手动添加的钩子会原样保留。多次执行不会重复添加。
- 即使将 Claude 设置文件夹链接到其他位置，安装和卸载也会指向同一个受管理文件夹。如果 Tasty 管理的 mod 内部文件或文件夹链接到其他位置，则拒绝安装和卸载。
- **更新 Tasty 后需重新执行。**钩子命令字符串保存在配置文件中，需要重新安装才能应用新格式。
- 将 Claude Code 因 API 错误（服务器过载、请求限制、认证失败等）结束回合的情况报告为空闲的钩子，也需要重新安装才会加入。此前，这类子智能体会一直显示为“工作中”。
- 如果子智能体在后台任务（后台 Shell、后台子智能体）仍在运行时因 API 错误结束回合，则保持“工作中”，直到后台任务完成后接续的回合结束。此行为也需要重新安装才会加入。
- 如果 Codex 出现 `hook returned invalid ... JSON output` 错误，请更新后重新执行 `tasty codex install`。这样会配置为不让 Tasty 的状态传递结果混入 Codex 的钩子响应。
- 在 Tasty 外运行 Claude Code 时，此钩子不生效。
- Codex 在新安装或变更的钩子经过审查前不会运行它们。安装后，请在 Codex 的 `/hooks` 中查看并批准 Tasty 钩子。Tasty 不会跳过此审查。
- 卸载使用 `tasty claude uninstall` / `tasty codex uninstall`。

如果使用其他 Codex home 或配置档，请指定安装位置。两个位置选项不能同时使用。
保留其他现有钩子和模型设置。

```sh
tasty codex install --codex-home /absolute/codex-home
# 直接选择配置档文件时：
tasty codex install --config-file /absolute/codex-home/work.config.toml
```

安装的钩子在当前会话中正常运行后，Tasty 会收到状态和会话信息。

- 智能体结束响应或提出问题时，该 Surface 会亮起**提醒边框**，侧边栏的工作区会显示徽标（等待回答问题时优先显示黄色）。
- 关闭标签页后恢复，或重启 Tasty 时，会继续同一会话（`claude -r` / `codex resume`）。
- 父智能体要接收子智能体的状态和结果，还需要[配置接收](#4-接收完成通知)。完成信息会逐行写入完成日志，受支持的父 Claude Code 通过完成通知 mod 接收。

执行 `tasty codex install` 后，在 Tasty 的 Bash、zsh 终端中照常输入 `codex` 或 `codex resume`，
也会保存恢复信息。仍可使用会话选择器，所选对话在发送新消息前
就会记录为恢复对象。批准、沙箱和模型选项也会保留。
启动时指定的批准和沙箱选项也适用于在同一 Codex 中启动的新对话（`/new`）。
在 Codex 中通过 `/permissions` 更改权限后，后续新对话使用更改后的值，恢复时则使用启动时指定的选项重新打开。
更新后，请重新执行安装命令并在新终端中启动。不会更改用户的全局 Shell 设置。

Tasty 为每个终端启动专用 Codex 服务器，并在 Codex 退出或终端关闭时一并清理。
不会重新连接已运行的对话和共享服务器。以 Codex CLI 0.154.0 为准。
即使插件目录或对话历史很大，也不会仅因响应大小而断开连接，会完整传递列表。
启动画面的自动恢复会等待 Tasty 就绪，最多等待 30 秒后继续。启动后无需单独唤醒终端。

自动连接支持批准、沙箱、模型、工作目录（`-C`）和会话选择选项。
对于 `-c`、配置档、`fork` 等不支持的选项，会提示后通过原始 Codex 运行，不登记为自动恢复对象。
`command codex`、显式指定的 `--remote` 和非交互命令也按原方式运行。
在 Bash、zsh 以外的 Shell 中，请使用下方的 `tasty codex launch`。

## 2. 启动

```sh
tasty claude launch --workspace myproj --directory ~/proj --task "修复测试"
tasty codex launch --workspace review --directory ~/proj
```

创建新工作区并在其终端中运行 CLI。省略 `--workspace` 时，名称为 `claude` / `codex`。

Codex 可通过 `--approval untrusted|on-request|never`、`--sandbox read-only|workspace-write|danger-full-access`、`--full-auto` 指定批准和沙箱策略（见下方“Codex 批准策略”）。

Claude Code 可通过 `--permission-mode` 指定权限模式（见下方“Claude 权限模式”）。

启用 Claude Code 插件时，即使从 Claude Code 会话中运行 Tasty，指向该会话的环境变量（`CLAUDECODE`、`CLAUDE_CODE_CHILD_SESSION`、`CLAUDE_CODE_MESSAGING_TOKEN` 等）也不会传递给 Tasty 终端中的 Shell 和钩子命令。在该终端中运行的 Claude Code 作为独立会话运行，也会保存对话记录。自行设置的 Claude Code 环境变量（如 `CLAUDE_CODE_GIT_BASH_PATH`）会原样传递。同样，启用 Codex 插件时，从 Codex 对话中运行 Tasty 不会传递指向该对话的 `CODEX_THREAD_ID`，因此不会将该终端中的 Shell 或 Claude 调用的 `tasty` 视为来自外层 Codex 的调用。`CODEX_HOME` 会原样传递。关闭插件后，不会清除该插件的变量，而是原样传递。

<a id="3-调用子智能体-spawn-tell"></a>

## 3. 将任务交给其他智能体（spawn / tell）

在 Claude Code 会话中，用以下命令运行其他智能体。分配任务的一方称为父智能体，新运行的一方称为子智能体。新智能体在指定工作区的窗格中以标签页打开，并记录此关系。

```sh
tasty claude spawn --workspace workers --cwd ~/proj --role tester --nickname t1 \
  --prompt "运行 cargo test 并报告失败原因"
tasty codex spawn --workspace workers --cwd ~/proj --sandbox read-only \
  --prompt "审查刚提交的 diff"
```

| 选项 | 含义 |
|---|---|
| `--workspace <ID 或名称>` | 必填。子智能体所在的工作区 |
| `--pane <ID>` | 工作区中的指定窗格（默认：第一个窗格） |
| `--cwd <路径>` | 子智能体的工作目录 |
| `--role <标签>` | 角色标签。通过 `broadcast --role` 选择发送对象时使用 |
| `--nickname <名称>` | 标签页中显示的名称 |
| `--prompt <文本>` | 启动后立即发送的第一条指令 |
| `--surface <ID>` | 父 Surface（默认：自身） |

`spawn` **立即返回**。没有单独的等待命令。完成子智能体的钩子和[接收配置](#4-接收完成通知)后，会将子智能体报告的空闲状态传递给父智能体。空闲不表示任务成功。Claude 子智能体的子智能体结束，或响应结束但仍有后台任务时，不视为空闲。后台任务完成且接续的响应也结束后才会通知。[Stop Gate](#8-claude-会话配置档和-stop-gate) 发送检查清单让响应继续时，也不视为空闲，通过 Gate 并结束响应后才会通知。如果留下永不结束的后台命令（如开发服务器），就不会进入空闲状态。等待后台任务期间没有输出时，会向父智能体通知一次。默认阈值为 10 分钟，具体取决于是否找到输出文件及是否仅剩 Monitor（[第 4 节的无输出通知](#4-接收完成通知)）。

父智能体将子智能体放在自身工作区以外的**其他工作区**中更安全。在已附加的远程工作区中运行子智能体的方法及结果接收条件，见下方“[在已附加的远程工作区中创建子智能体](#在已附加的远程工作区中创建子智能体)”一节。子智能体使用远程计算机的工具和设置运行。

之后可向子智能体发送追加指令或查看状态。

```sh
tasty claude tell "这次也运行 clippy" --surface 57     # 支持多行，自动提交
tasty claude children                                       # 子智能体列表（index · surface · 状态）
tasty claude state --surface 57                             # idle / needs_input / active / exited
tasty claude broadcast "报告进度\r" --role tester   # 按角色批量发送（用 \r 提交）
tasty claude kill --child 0                                 # 按 index 终止
tasty claude respawn --child 0 --prompt "重新开始"          # 在原位置重新启动
tasty claude parent --surface 57                            # 此子智能体的父智能体
```

未带提示词启动的 Claude 子智能体在显示等待输入画面时为 `idle`。此时不会发送完成通知。只有结束响应时才会发送完成通知。通过 `--prompt` 启动的子智能体在处理该提示词期间为 `active`。

`tasty codex …` 也有相同的子命令（`tell` / `children` / `state` / `broadcast` / `kill` / `respawn` / `parent`）。在 Codex 对话中执行时，结果接收方式不同（[自动传递给父 Codex](#自动传递给父-codex)）。

子智能体过多时，spawn 响应会附带警告。可在**设置** <!-- en: Settings --> › **插件** <!-- en: Plugins --> › **Claude Code** / **Codex** 的 **Spawn 子实例警告阈值** <!-- en: Spawn child warning threshold --> 中更改阈值（Claude Code、Codex 均默认为 6）。

### 子 Claude 的模型和 effort

可仅为本次子会话指定模型和 effort。

```sh
tasty claude spawn --workspace workers --cwd ~/proj --model opus --effort high \
  --prompt "调查测试失败原因"
```

`--model` 接受别名、完整模型 ID、提供方 ARN 等标识符。`--effort` 接受 `low`、`medium`、`high`、`xhigh`、`max`、`ultracode`，是否支持取决于 Claude CLI 和模型。`ultracode` 请求 xhigh 和 Ultracode，需要 Claude Code 2.1.203 或更高版本。

省略的选项遵循现有 Claude 设置。不会更改父智能体、其他子智能体或全局设置。与 `--profile-file` 或 `--profile` 一起使用时，显式指定的模型和 effort 优先，配置档文件保持不变。钩子正常运行后，恢复或 reboot 同一会话时也会保留这些值。新的 respawn 不继承这些值。

命令返回不表示模型已响应。如果提供方拒绝该模型，Tasty 不会换用其他模型重试。请在 Claude 画面中查看实际模型和 effort。

## 4. 接收完成通知

无论子智能体是 Claude 还是 Codex，父 Claude Code 或普通终端的状态通知都会逐行写入父智能体的完成日志。父 Codex 对话使用下方单独的结果返回路径。
即使向同一子智能体多次发送 tell，每次状态变化也只留下一个记录行。其他父智能体向同一子智能体发送 tell 的通知，会单独写入该父智能体的日志。
输入请求、中断、错误和进程退出也属于状态通知，不要将通知直接视为任务成功。
如果 Claude 子智能体因 API 错误结束回合，完成通知行末会附上该情况和错误种类（如 `overloaded`）。如果仍有后台任务且子智能体继续等待，则不会写入完成行，而是仅写入一行说明该情况。
Claude 子智能体的无输出通知默认以 10 分钟（600 秒）为阈值。可在[设置 > 插件 > Claude Code](../plugins/index.md#插件添加的设置) 中改为 60～86400 秒，无需重启即可生效。没有关闭通知的取值。

等待后台 Shell 或子智能体的子智能体，在找到的所有任务输出文件持续配置时长未变化时，每次等待仅写入一行带任务名称的记录。英文为 `background work <名称> has written no output for <分钟> min`。如果找不到任务输出，则在画面输出持续未变化的时间达到 10 分钟与配置值中的较大值时，每次等待仅写入一行。此时英文为 `waiting on background work (<种类>) for <分钟> min, with no output meanwhile`。实际通知遵循应用语言。

Monitor 仅在有事件时输出，因此无输出是正常情况。已结束响应且仅剩 Monitor 任务的子智能体不会触发无输出通知。此类子智能体在 Monitor 结束前保持 `active`，也不会发送完成信号。如果 Monitor 与其他任务并存，则仅根据其他任务判定。

此通知会写入完成日志，并唤醒已完成下方 mod 或 Monitor 接收配置的父 Claude Code，启动新回合。此通知路径不适用于从父 Codex 对话中创建的子智能体。父 Codex 通过下方的结果返回路径接收回合结果。

在非等待后台任务的回合中，如果最后的输出包含错误文本，阈值固定为 30 秒。错误后的 30 秒和重复通知的最小间隔 5 分钟不可配置。同一段无输出期间仅通知一次。此设置与 `tasty claude children` 中 `stale` 标记的 120 秒阈值相互独立，因此可能在通知前先看到 `stale`。不能仅凭通知断定任务已停止。

要获取能区分 Monitor 的新钩子，请重新执行 `tasty claude install`，然后启动新的 Claude Code 进程。此前会将 Monitor 也视为 Shell 任务并发送通知。

受支持的父 Codex 对话会收到结果引用，表示子智能体已结束响应。用引用中的事件 ID 执行 `tasty codex result` 读取回答。连接条件和支持的路径见下方[自动传递给父 Codex](#自动传递给父-codex) 一节。

### 在 Claude Code 中自动接收

更新后，请重新执行 `tasty claude install` 并启动新的 Claude Code 会话。安装命令会保留现有钩子和其他插件路径，同时安装完成通知 mod 和防重复插件。基于 Claude Code 2.1.307 的 mod API 编写。实际模型回合的接收验证需单独进行，不将用量限制或认证错误视为成功。

mod 启用后，从会话开始就读取自己的完成日志；如果 Claude 正在工作，则在该回合结束后通过插件消息通知。新会话不会重新传递旧日志，mod 刷新时从保存的位置继续读取。通知待发送期间即使 mod 刷新，通常也只传递一次，可能会显示一条已跳过第二份副本的简短提示。极少数情况下，如果防重复插件本身在传递期间重启，同一通知可能再到达一次，但不会丢失。此行为适用于安装后新启动的 Claude 会话。未读日志被清理后无法恢复。状态通知不是任务成功的证据。

可在该 Claude 的 Bash 中检查 `TASTY_CLAUDE_NOTIFY_MOD` 的值是否与自身 Surface 编号一致。同时启用 mod 和 Monitor 会造成重复通知。在带有此标记的会话中，也应省略现有个人指令或技能中的 Monitor 流程。Tasty 不会自动更改这些文件。卸载使用 `tasty claude uninstall`。

### 通过 Claude Code 的 Monitor 接收

仅在父 Claude Code 不支持 mod 或未能启用 mod 时使用 Monitor。在首次 spawn/tell 前订阅，并在订阅后立即查看子智能体列表。

```text
Monitor({ command: "tail -n0 -F \"$TASTY_PARENT_HOME/notify/$TASTY_SURFACE_ID.log\"", timeout_ms: 1800000 })
```

Monitor 最多 30 分钟后到期。收到到期通知时，用相同命令重新订阅，并立即用 `tasty claude children` 查看一次子智能体状态。此列表也包含 Codex 子智能体（`tasty codex children` 也显示相同的子智能体）。这样不会漏掉订阅中断期间结束的子智能体。

日志文本遵循应用语言。Claude 和 Codex 子智能体在同一文件中逐行记录通知。**重启 Tasty 会删除上次运行的完成日志。**仅直接读取文件而不使用 Monitor，不能自动继续，也不能永久保存日志。

写入新行前，如果文件大小已达到 **256 KiB**，会先清空整个文件再写入。不会仅保留末尾部分，因此未读通知也会一并消失。添加一行或多个子智能体同时写入期间，可能超过此大小。清空时，通常会将下方的 `retention_start` 累计值增加所清空的字节数。如果其他子智能体正在同时写入，导致未能及时轮到清理，则会在不增加累计值的情况下清空，因此也无法通过累计值获知此时丢失的通知。没有保留期限或文件数量限制，已关闭标签页的日志也会保留至下次重启。

如果直接接续读取完成日志，也请检查旁边 `<编号>.log.meta` 文件中的 `retention_start`。该值是至今已清空的字节总数。可与保存的读取位置比较，检查中间是否丢失记录。但如果日志清理或元数据写入失败，可能产生未计入累计值的丢失，因此此方法不能发现所有遗漏。Monitor 订阅无需直接读取此文件。

**不要使用同一数据文件夹启动两次 tasty。**后启动的实例在启动时会删除整个完成日志
文件夹，此时先启动的实例正在写入的完成日志也会消失。要同时使用两个实例，
请通过 `TASTY_HOME` 分别指定数据文件夹。

### 自动传递给父 Codex

即使从桌面启动 Tasty，也会自动传递 Codex 对话使用的运行路径，以接收结果。无需在每次 `spawn`、`tell` 时指定运行路径或接收目标。

在 Codex 对话中执行 `tasty codex spawn`（或 `tell`、`respawn`）后，每次子智能体结束响应，
结果都会自动返回该对话。没有单独的准备命令。

```sh
tasty codex spawn --workspace workers --cwd ~/proj --sandbox read-only \
  --prompt "审查刚提交的 diff"
```

父对话会收到如下简短引用消息。不包含子智能体的回答正文。

```text
[tasty] A child agent reported a turn boundary. provider=codex status=turn_ended event=<事件 ID>. ...
```

父智能体用消息中给出的命令读取结果。

```sh
tasty codex result <事件 ID>
```

- 仅收到结果的对话可以读取。多次读取不会删除结果。
- 结果在子 Codex 实际结束该回合后，记录为该回合的最后回答。即使其他 Stop 钩子让响应继续，返回的也是最后回答，而非中间回答。
- `status` 只说明响应如何结束，不判断任务是否成功。取值包括 `turn_ended`（响应结束）、`interrupted`（用户中断）、`exited`（会话退出。子智能体在同一画面中通过 `/new` 仅切换对话不算退出）、`turn_failed`（因错误结束）。
- 回答超过 1 MiB 时会截断保存，并标记为 `body_truncated`。
- 即使同一响应报告两次，也只传递一次。
- 因暂时无法连接共享 Codex 服务器而未能发送的结果，会逐渐延长间隔重发（最长 1 分钟）。失败超过十二次后，会在该对话的下一个结果到达或 Tasty 重启时重新发送。
- 结果在传递完成后保留 30 天，之后删除。

父智能体能接收结果的情况有两种。

- 父智能体是通过 Tasty 启动命令运行的 Codex。如果父 Codex 暂时关闭，会保留结果，并在该对话于 Tasty 中重新打开时发送。在同一画面中通过 `/new` 启动新对话或返回其他对话后，之后的结果由当前运行的对话接收。
- 父智能体是 Tasty 外的 Codex，且该对话已在用户的共享 Codex 服务器中打开。

如果两者都不是，则不创建子智能体，并显示父智能体无法接收结果的错误。父 Claude Code 通过[完成日志](#4-接收完成通知)接收。

Codex 对话仅管理自己创建的子智能体。在同一画面中通过 `/new` 启动的新对话，也无法列出或关闭之前对话的子智能体。向其他父智能体的子智能体发送 `tell`，或通过 `--surface` 指定其他父智能体，都会被拒绝。如果 Claude Code 或普通终端向同一子智能体发送新指令，之后的结果不再返回原 Codex 对话。当时尚未结束或未确认的响应结果也不再返回。已返回的结果仍可读取。

如果 Codex 对话的子智能体分布在多个工作区，请在 `children`、`broadcast`、`kill`、`respawn` 中通过 `--workspace` 指定其中一个。请求仅到达指定工作区所在窗口中的子智能体，因此子智能体分布在多个窗口时，请按窗口分别请求。如果子智能体仅在一个工作区中，或已指定目标子智能体，则无需指定。

### 在 Codex 对话中调用子 Claude

在 Codex 对话中执行 `tasty claude spawn`、`tell`、`children`、`broadcast`、`kill`、`respawn` 时，会自动确定父智能体。无需提供 `--surface`，提供其他对话的 Surface 会被拒绝。必须安装并启用 Codex 插件，否则会报错结束，不会改用其他父智能体。

```sh
tasty claude spawn --workspace workers --cwd ~/proj --prompt "运行测试"
tasty claude tell "这次也运行 clippy" --surface 57   # 仍需指定目标子智能体
```

子 Claude 结束响应后，回答会返回原 Codex 对话。如果 Stop Gate 让响应继续，或仍在等待后台任务，则不会发送，只有响应实际结束时才发送一次。合并到同一响应中的 tell 会作为一个结果返回。返回结果表示响应结束，不代表任务正确。因 API 错误结束的响应及响应期间退出的子智能体，也会按对应状态报告。

即使在子智能体中执行 `/clear` 或 `/resume`，后续响应仍会返回同一 Codex 对话。如果 Claude Code 未等待旧会话的结束通知就启动新会话，则会在新会话开始下一次响应时接续。

如果子智能体结束后，在同一 Surface 中重新运行 Claude，从 Codex 对话再次向该子智能体发送 `tell`，就会返回新运行实例的响应。如果从 Codex 以外的位置（普通 Shell 或父 Claude）向同一子智能体发送 `tell` 或执行 `respawn`，该子智能体的结果不再传递到 Codex 对话。已结束响应的结果仍会发送。

无法将结果交给 Codex 插件时，会保留结果而不丢弃。自动重发的间隔逐渐延长（最长 5 分钟），一天后仍未能交付则停止自动重试。同一结果即使重新发送，在 Codex 对话中也只会出现一次。

```sh
tasty claude codex-returns           # 查看待发送结果和正文
tasty claude codex-returns --retry   # 将所有待发送结果重新排为立即发送
```

`--retry` 也会将已停止自动重试的结果重新排入发送队列，不等待发送就立即结束。因此一同输出的列表中可能仍包含刚重新排入的结果。稍后再用 `codex-returns` 查看。

如果一个 Codex 对话的子智能体位于多个工作区，请在 `children`、`kill`、`broadcast`、`respawn` 中通过 `--workspace` 指定哪个工作区的子智能体。不指定时，会列出候选并拒绝请求。以子智能体当前所在工作区为准，因此恢复后移至其他工作区的子智能体，也按当前位置查找。

### 在已附加的远程工作区中创建子智能体

如果尚未附加，用 `tasty remote attach --into-gui --workspace <远程 ID> --profile <名称>` 向正在运行的 Tasty 添加镜像。要新建远程工作区并附加，请用 `--new-workspace` 替换 `--workspace <远程 ID>`，可通过 `--name`、`--cwd` 指定名称和远程工作目录。也可使用 `--ssh <目标>` 代替配置档。Tasty 会自行打开 SSH 隧道，不移动焦点。附加现有工作区会输出受理和结果两行 JSON，并等待结果最多 90 秒；失败或未在时限内收到结果时，退出码为 1。新建工作区形式输出一行创建结果 JSON。

在 `tasty list workspaces` 中查看 `[mirror]` 行的本地工作区 ID，并将该 ID 传给下方 spawn 的 `--workspace`。不要直接使用 attach 时指定的远程 ID。使用会话令牌调用 `tasty remote attach --into-gui` 和 `tasty remote refusals` 无需额外权限，但 `tasty list workspaces` 需要 `surface.read` 权限。CLI 没有仅断开附加连接的命令，关闭镜像的最后一个 Surface 会同时关闭远程工作区。连接方式及在 GUI 中仅分离的方法，见[继续远程工作](../remote/attach.md)。

如果已附加其他计算机的 Tasty 工作区，可将该工作区编号传给 `--workspace`，执行 `tasty claude spawn`、`tasty codex spawn`。子智能体在远程计算机上，使用该计算机的 Claude Code、Codex 安装、设置和登录状态运行，在本地显示为已附加工作区中的子智能体。`tell`、`children`、`kill` 的用法与本地子智能体相同。

```sh
tasty claude spawn --workspace 7 --prompt "运行测试"    # 7 是已附加的远程工作区
```

- 远程计算机也必须通过 `tasty claude install`、`tasty codex install` 安装钩子，完成信息才会返回。没有 Claude 钩子时，spawn 结果会显示警告。
- 完成通知会进入本地父智能体的完成日志；如果父智能体是 Codex 对话，响应结果也会返回该对话。即使结果延迟到达，也会传递给下达该响应指令的对话。
- 如果父智能体是 Claude 会话或 Shell，响应正文会保存在本地，完成日志中会收到一行结果 ID 和读取命令。该行与状态变更行分开发送，因此收到状态行后，请等待结果行。无需通过 SSH 登录远程计算机。

  ```sh
  tasty claude remote-results --id 0123456789abcdef   # Claude 子智能体的结果正文（Codex 子智能体使用 tasty codex remote-results）
  tasty claude remote-results                         # 已保存的结果列表（不含正文）
  ```

  结果行的文本会根据 Tasty 的语言设置翻译。例如，英文为 `surface 12: turn result 0123456789abcdef (turn_ended) is stored. Read it with: tasty claude remote-results --id 0123456789abcdef`，韩文为 `surface 12: 턴 결과 0123456789abcdef (turn_ended)을(를) 저장했습니다. 읽기: tasty claude remote-results --id 0123456789abcdef`。用脚本查找结果行时，请从行末的 `tasty claude remote-results --id <ID>`、`tasty codex remote-results --id <ID>` 命令部分同时提取 claude/codex 和 ID（16 位小写十六进制数），不要匹配 `turn result` 等文本或行内任意十六进制数。例如：`grep -E '(^| )tasty (claude|codex) remote-results --id ([0-9a-f]{16})$'`

  子智能体关闭后，结果仍保留 7 天。如果下达指令后父会话已更换或父智能体已关闭，则仅保存结果而不通知，请在列表中查找。连接故障期间，同一结果行可能再到达一次，但 ID 相同，可以再次读取。
- 只有创建远程子智能体的父智能体才能向其发送 `tell`。其他父智能体（包括在同一画面中新启动的 Claude 对话）发送时会被拒绝，以免响应传递给错误的父智能体。请为该父智能体新建子智能体。对于无法确定创建者的子智能体（如在此规则出现前创建的远程子智能体），任何父智能体都无法发送 `tell`，请重新创建。
- 连接断开时，可能会提示无法确定指令是否已执行。重试前请用 `children` 查看。如果手动断开后重新附加，会视为新连接，无法继续接收旧连接中所发指令的结果。
- `--cwd`、`--profile-file` 必须使用远程计算机上的绝对路径。如果是相对路径或远程计算机上不存在的路径，则拒绝请求，不创建子智能体。
- 附加期间，远程用户无法对该子智能体执行 `tell`、`kill`、`respawn`、`reboot`。仅附加方可以操作。
- 远程子智能体不支持 `respawn`、`broadcast`。

### 自动恢复因 API 错误而停止的 Claude

如果 Claude 因服务器过载等临时 API 错误结束回合，Tasty 可在短暂等待后代为发送“继续执行”，让任务继续。**默认关闭。**在**设置** <!-- en: Settings --> › **插件** <!-- en: Plugins --> › **Claude Code** 中启用。

- **临时 API 错误（服务器过载）后自动继续** <!-- en: Resume automatically after a temporary API error (server overload) --> — 开启／关闭。
- **继续前的等待秒数** <!-- en: Seconds to wait before resuming --> — 默认 10 秒。可设为 1 秒至一天（86400 秒），超出范围的值会调整至最近的边界值。
- **放弃前连续自动继续的次数** <!-- en: Consecutive automatic resumes before giving up --> — 默认 5 次。连续失败达到该次数后，不再发送，并显示一次通知。
- 超出请求限制、认证失败、付费问题等重发后仍会发生相同错误的情况，不会自动继续。
- 等待期间手动输入则不会发送。如果在该回合开始后曾在该 Surface 中按过任何键或粘贴过内容（输入框中可能有尚未写完的文本），则不会自动继续。
- 自动发送次数可在 Surface 元数据 `claude-auto-resume-count` 中查看。
- 此功能需要通过 `tasty claude install` 安装的钩子。更新 Tasty 后请重新安装。

## 5. Codex 批准策略

`tasty codex spawn/launch/respawn/reboot` 通过标志接收 Codex 的批准和沙箱策略。

`launch`/`spawn`/`respawn`/`reboot` 不经过 Shell 的 `codex` 别名或函数，而是运行 `PATH` 中安装的 Codex。别名中设置的批准和沙箱选项，请通过下方标志或全局设置指定。启动命令使用 sh/bash/zsh 和 Windows Git Bash 语法。

- **批准**：`--approval untrusted|on-request|never`。没有调用选项时，使用插件的全局默认值。如果该设置也不存在或为**继承**，则以 **`never`** 运行。此默认值用于避免自动化因等待批准响应而停止。仅在有人在旁批准时显式指定 `untrusted` / `on-request`。
- **沙箱**：`--sandbox read-only|workspace-write|danger-full-access`。没有调用选项时，使用插件的全局默认值；如果该设置也不存在或为继承，则使用 Codex 默认值。用于审查和交叉验证的子智能体适合使用 `read-only`。
- `--full-auto`：同时绕过批准和沙箱。不能与 `--approval`/`--sandbox` 一起使用。
- 全局默认值位于**设置** › **插件** › **Codex** 的**默认批准策略** <!-- en: Default approval policy --> / **默认沙箱模式** <!-- en: Default sandbox mode -->。每次调用的标志优先。
- 重新打开现有对话的 `reboot` 和标签页恢复也适用同一策略。如果无法应用策略，则不会启动 Codex，而是在终端显示原因。

在容器等不支持嵌套沙箱的环境中，如果指定 `--sandbox` 后出现 `RTM_NEWADDR: Operation not permitted` 等错误，请使用 `--full-auto`。完成通知也会附带此提示。

### 各子智能体的模型和推理强度

可通过 `tasty codex spawn --workspace workers --model gpt-6.1-sol --effort medium --prompt "运行测试"` 为各子智能体指定模型和推理强度。两个选项均为可选，省略时使用现有 Codex 设置。不会更改全局设置、父智能体或其他子智能体的模型。恢复同一对话的标签页或执行 `reboot` 时，也会保留显式指定的值。

`--effort` 接受 `none|minimal|low|medium|high|xhigh|max|ultra`。模型标识符请使用 Codex 提供的值。模型和推理强度是否受支持由 Codex 判断，被拒绝时显示错误，不会自动切换到其他模型。


## 6. Claude 权限模式

`tasty claude launch/spawn/respawn/reboot/child-profile` 通过标志接收子 Claude 的权限模式。

- `--permission-mode acceptEdits|auto|bypassPermissions|manual|dontAsk|plan` — 原样传递给 Claude Code。
- **没有调用选项时，使用插件的全局默认值。**如果该设置也不存在或为**继承**，则不添加权限模式标志，遵循现有 Claude Code 设置。Tasty 不会自动切换到跳过批准的模式。
- 自动化期间如果不希望子智能体因等待批准而停止，请仅为该次调用显式指定所需模式。已停止子智能体的状态也会按[接收配置](#4-接收完成通知)传递。
- 全局默认值位于**设置** › **插件** › **Claude Code** 的**子会话的默认权限模式** <!-- en: Default permission mode for child sessions -->。默认值为**继承**（不添加标志），每次调用的标志优先。
- 如果通过 `--profile` / `--profile-file` 附加的设置 JSON 已设置 `permissions.defaultMode`，则不能与 `--permission-mode` 一起使用——两者设置同一项，因此会报错要求二选一。
- 在 `reboot` / `child-profile` 中指定的模式**仅适用于该次 Reboot**。之后恢复标签页时不会沿用。

<a id="6-会话-reboot-reboot"></a>

## 7. 会话 Reboot（reboot）

更改钩子或设置后，以同一会话重新启动智能体。

```sh
tasty claude reboot --surface 57 --delay 5
tasty codex reboot --surface 58
```

在指定时间后终止进程，并继续启动同一会话。智能体对**自身**调用时，应将其作为该回合的最后一个操作——之后的响应会因进程退出而中断。仅对其子智能体执行 Reboot 时，不会中断请求该操作的智能体的响应。

`tasty codex reboot` 的成功响应表示已安排 Reboot。是否完成请在插件日志（`tasty plugin logs com.tasty.codex`）中查看。如果等待期间在同一终端中重新启动 Codex，Reboot 会停止，不会向该 Codex 输入内容。

<a id="7-claude-会话配置档和-stop-gate"></a>

## 8. Claude 会话配置档和 Stop Gate

Claude Code 仅在启动时读取一次钩子。要仅为特定会话附加额外钩子和权限，请注册配置档，并在启动时通过 `--profile` 指定。

```sh
tasty claude profile-register strict --file ./strict.json   # 按名称注册设置 JSON
tasty claude profile-list
tasty claude spawn --workspace w --profile strict           # 仅应用于此子智能体
tasty claude reboot --profile strict                        # 后续 Reboot 也继承
tasty claude child-profile --child 0 --profile strict       # 持续附加到子智能体
```

使用 **Stop Gate** 可让智能体在结束响应前，按检查清单重新检查任务。启用内置 Gate `continue-checklist` 并将其关联到会话。

```sh
tasty claude checklist-enable                               # 启用 Gate（用 checklist-disable 关闭）
tasty claude checklist-status                               # 查看当前是否启用
tasty claude spawn --workspace w --profile continue-checklist
```

`checklist-enable`、`checklist-disable`、`checklist-status` 可通过 `--gate <名称>` 指定其他已注册的 Gate（默认为 `continue-checklist`）。用 `tasty claude gate-list` 一次查看所有 Gate 的启用状态。

- 智能体在响应末尾加入 `[[TASTY-CHECKLIST-DONE]]` 则通过，否则会再次收到检查清单。达到轮次上限（默认为 3）后自动通过。
- 上限位于**设置** › **插件** › **Claude Code** 的 **Gate 默认轮次上限** <!-- en: Default gate round limit -->。
- 要创建自己的 Gate，使用 `tasty claude gate-register <名称> --body-file <文件> [--sentinel <字符串>] [--rounds N]`。正文必须包含哨兵字符串。用 `gate-list` / `gate-show` 查看。

## 故障排除

- **未收到完成通知** — 检查子 CLI 的钩子安装、运行情况及[接收配置](#4-接收完成通知)。如果父智能体是 Claude Code，请检查完成通知 mod 是否启用。没有 mod 时，请检查 Monitor 订阅。钩子传递失败会记录在 `~/.tasty/hook-failures.log` 中。插件日志使用 `tasty plugin logs com.tasty.claude --follow`。
- **`reboot` 因“claude-session-id meta not set”失败** — 会话启动钩子未能记录会话 ID。用 `tasty surface-meta set --key claude-session-id --value <会话ID>` 手动设置。
- **子智能体未能 spawn，出现“occupied”错误** — 目标工作区正被远程附加，或是镜像。请使用其他工作区。
- **`kill` 因“hard-occupied”错误被拒绝** — 远程用户正附加并使用该子智能体所在的工作区。子智能体关系和标签页会保留。远程端分离，或通过强制分离解除占用后，再执行 `kill`。
- **Codex 无法启动，显示“app-server could not start”** — Tasty 未能启动该终端的专用 Codex 服务器。请检查在同一终端中能否运行 `codex app-server --help`。此功能基于 Codex CLI 0.154.0 验证。
- **父 Codex 未收到结果** — 检查 Codex 的 `/hooks` 中是否已批准 Tasty 钩子，以及是否从 Codex 对话中 spawn 子智能体。如果通过手动输入 `codex` 启动父 Codex，该对话必须已在共享 Codex 服务器中打开。

<a id="接下来阅读"></a>

## 相关阅读

- [管理任务顺序](tasks.md) — 将 spawn 和 tell 按依赖关系组织为一个图运行。
- [钩子、通知和 Webhook](hooks-notifications.md) — 完成通知和批准 Gate。

重新安装 Codex 集成时，也会注册 SessionEnd 钩子。当前运行会话退出时，对该任务完成的等待也会结束。

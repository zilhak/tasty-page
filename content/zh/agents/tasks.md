<!-- source-hash: 1c02c58e407e -->
<a id="任务-dag"></a>

# 任务顺序管理（DAG）

注册任务并连接依赖关系后，即可按前序步骤的完成顺序执行任务。先用 `task-run`、`task-create`、`task-await` 执行一个任务，再连接执行顺序和失败处理。

通过 `tasty` CLI 创建和管理任务。首次使用时，按[启动运行器](#启动运行器) → [创建任务](#创建任务) → [查看结果](#查看结果)这三节，用 `task-run`·`task-create`·`task-await` 完整执行一个任务。之后的顺序连接、结果传递、分支和同步可按需阅读。要在界面中查看执行情况，参阅[查看进度](#查看进度)。

每条命令都用 `--workspace` 指定任务所属的工作区（也接受旧写法 `--workspace-id`）。即使正在查看其他工作区，也会在指定的工作区中操作。

## 启动运行器

即使创建了任务，运行器未启动时也不会执行任何任务。每个工作区启动一次。

```sh
tasty agent task-run --workspace 2 --action start
tasty agent task-run --workspace 2 --action status
tasty agent task-run --workspace 2 --action stop
```

重启 tasty 后，运行器不会自动启动。任务本身仍会保留，再次 `start` 即可继续。重启前等待外部完成信号的任务，重启后不会再由该信号完成；设定的等待时间到期后，正在运行的运行器会将其以超时失败结束。运行器停止时，DAG 界面的运行器标记也会显示这一状态，将鼠标悬停在标记上可直接看到重新启动的命令。DAG 标签页的页首也会单独列出这一行命令。

## 创建任务

```sh
BUILD=$(tasty agent task-create --workspace 2 --name build \
  --command '{"kind":"run","command":["cargo","build"]}' | jq -r .id)
```

创建后返回任务 ID。用此 ID 设置依赖关系和查询状态。

| 命令种类 | 作用 |
|---|---|
| `run` | 执行指定命令。这是不占用终端的后台进程，结果分别保留标准输出和标准错误末尾最多 64KiB 的内容。不适合交互式程序。继承启动 Tasty 时的环境，但有下表之后说明的例外 |
| `custom` | 将 tasty 自身的操作创建为任务。启动子智能体等创建终端的操作属于此类。对于需要单独等待完成的操作，通过图提交的任务会将首次接收响应单独保留在结果的 `raw.accepted` 中，与最终响应分开 |
| `reduce` | 将多个任务的结果合并为一个 |
| `wait_barrier` | 等待屏障收齐所有信号 |
| `agent` | 向 Claude 或 Codex 等智能体会话发送一条指令，并将回答作为结果。详见下文[让智能体执行任务并将回答作为结果](#让智能体执行任务并将回答作为结果) |

也可将命令 JSON 单独存入文件，以 `--command @build.json` 的形式传入。

若定期查询 `custom` 任务是否完成，用 `poll.interval_ms` 指定查询间隔（默认 500ms）。首次立即查询，之后每次在上一次查询结束后等待指定时间。等待同一目标的任务也会分别查询。运行器繁忙时可能延后查询，但不会集中补发积压的查询。若设置了 `poll.timeout_ms`，即使尚未到下一次查询时间，也会检查截止时间。重启后再次启动运行器，会按保存的间隔和截止时间恢复查询，不会重新发送原执行请求。0ms 表示运行器每次推进时查询一次。

单个任务的定义（命令、元数据、结果类型等）转换为 JSON 后最多为 768 KiB（若记忆条目的大小上限设为小于 1 MiB，则相应缩小）。超过上限时不会创建任务，并返回错误。大数据应放在文件中并传入路径。如果执行前填入前序任务的结果后超过此大小，该任务会直接失败，不执行。

`run` 命令、下文的后处理命令，以及通过 Shell 命令合并结果的归约器，均继承启动 Tasty 时的环境。但如果在 Claude Code 内启动 Tasty，则不传递指向该会话的变量（与终端相同）；如果从另一个 Tasty 的终端启动，也不传递指向那个 Tasty 的 `TASTY_SESSION_TOKEN`·`TASTY_SURFACE_ID`·`TASTY_PARENT_HOME`·`TASTY_AGENT_ID`。因此，在命令中调用 `tasty` 会连接到当前这个 Tasty。

## 查看结果

```sh
tasty agent task-await --workspace 2 --id "$BUILD"   # 等待完成（默认最多 10 分钟）
tasty agent task-get --workspace 2 --id "$BUILD"     # 再次查看状态和结果
```

`task-await` 响应中的 `outcome` 为 `terminal` 时，表示任务已结束；根据 `state` 是 `succeeded` 还是 `failed` 判断是否成功。`timed_out`（等待超时）和 `not_found`（任务不存在）也会以退出码 0 返回，因此不要仅凭退出码判断。`run` 任务的退出码和输出位于响应的 `result` 中。等待时间选项见[等待和管理任务](#等待和管理任务)。

以上是执行单个任务并查看结果的基本流程。以下各节是将多个任务按顺序连接、传递结果和分支的高级步骤。

## 顺序和失败处理

```sh
TEST=$(tasty agent task-create --workspace 2 --name test \
  --command '{"kind":"run","command":["cargo","test"]}' \
  --depends-on "$BUILD" --on-failure abort | jq -r .id)
```

`--depends-on` 中列出的任务必须全部结束，此任务才会进入就绪状态。创建时会拒绝形成环的图。

| 失败策略 | 含义 | 设置位置 |
|---|---|---|
| `abort`（默认） | 依赖的任务失败时，跳过此任务，其下游任务也依次跳过 | 依赖方 |
| `continue_downstream` | 即使依赖的任务失败，此任务仍继续执行 | 依赖方 |
| `fallback:<任务 ID>` | 此任务失败时，唤醒该任务作为替代 | 可能失败的一方 |

设置位置容易混淆。`abort` 和 `continue_downstream` 必须设置在**后续**任务上，才会影响该任务的就绪判断；`fallback` 则相反，必须设置在**可能失败**的任务自身。设置在其他位置时，不会应用预期的失败处理。

即使 Tasty 繁忙，未能及时响应 `custom` 任务的请求，也不会立即将任务判为失败。状态查询延迟时，会在下一次查询时再次询问；尚未执行就已过期的请求会重新发送。已开始执行的请求（如启动子智能体）不会重新发送，以免执行两次，而是等待延迟的响应。如果最终仍未收到响应（如期间重启了应用），任务会变为 `unknown`，而不是失败。确认请求是否实际生效（如子智能体是否已启动）后，再重新执行或取消。

用作回退的任务必须先于主任务创建。为防止运行器在此期间先执行它，创建回退任务时使用 `--reserved-for-fallback`。预留后，即使尚未创建主任务也不会执行。连接主任务后，会继续等待主任务失败并激活回退。

## 传递前序任务的结果

`--depends-on` 只关联顺序。要将前序任务的结果作为后续任务的**输入**，需使用占位符。

```
${task.<任务 ID>.output}          完整结果
${task.<任务 ID>.output/stdout/text}   结果中的一个值
```

调度任务时，该位置会填入实际值。用于传递创建时未知、执行后才能确定的值，例如先启动子智能体，再向该子智能体发送消息的流程。引用的任务必须列在 `--depends-on` 中，否则创建时会被拒绝。值的结构会保留。仅包含一个占位符的字符串，在值为数字时会转换为数字。

## 一次发送指定类型的任务组

若还要指定结果类型，可将任务组成一个图提交。系统先检查整个图，因此只要有一处错误，就不会创建任何任务，错误中会指出哪个任务的哪个位置有误。在所有任务创建完成前，不会执行任何任务。一个图最多包含 1000 个任务，更多任务需拆成多个图提交。

```sh
tasty agent task-graph-submit --workspace 2 --graph @graph.json --dry-run   # 仅检查
tasty agent task-graph-submit --workspace 2 --graph @graph.json
```

```json
{"contract_version": 2,
 "tasks": [
   {"id": "build", "command": {"kind": "run", "command": ["cargo", "build"]}},
   {"id": "report", "command": {"kind": "run", "command": ["notify"]},
    "input_schema": {"type": "object", "fields": {"code": {"type": "int64"}}},
    "bindings": {"code": {"from_task": "build"}},
    "input_mapping": {"args": ["/code"]}}]}
```

各任务的 `id` 自行指定。`bindings` 指定输入的来源。可使用固定值（`literal`）、前序任务结果中的一个值（`from_task` 和 `pointer`），或主任务与回退任务中实际执行的一方（`one_of`）；类型不匹配时，提交会被拒绝。收到的值只会填入 `input_mapping` 指定的位置。`args` 将值逐个作为参数追加到命令后，`stdin: true` 则将完整输入以 JSON 写入标准输入。`wait_barrier` 任务可通过 `"barrier": "/<字段>"` 从输入获取要等待的屏障名称，此时命令中不填写 `name`。值中的 `$(...)` 或空格不会再次解析。实际传入的值可在任务的 `input_snapshot` 中查看。此类图中的任务不使用上面的占位符。

要将已有文件传给 `run` 任务，在 `args` 中使用 `{"file": "/<字段>"}`。该字段的字符串是文件路径，此路径会作为参数追加到命令后。任务执行前会检查文件是否可读；文件不存在或不可读时，不执行命令，并在输入阶段失败。仅当命令设置了 `cwd` 时才接受相对路径，并以其为基准。Tasty 不创建或删除文件，因此文件的准备和清理由前后任务或脚本负责。以下脚本将 diff 写入文件并传给检查命令，即使检查失败，最后也会删除文件。

```sh
#!/bin/sh
# lint-diff.sh <workspace id>
set -eu
diff_file=$(mktemp)
git diff > "$diff_file"
tasty agent task-graph-submit --workspace "$1" --graph "$(cat <<JSON
{"contract_version": 2, "tasks": [
  {"id": "lint", "command": {"kind": "run", "command": ["my-lint", "--diff"]},
   "input_schema": {"type": "object", "fields": {"diff": {"type": "string"}}},
   "bindings": {"diff": {"literal": "$diff_file"}},
   "input_mapping": {"args": [{"file": "/diff"}]},
   "on_failure": {"kind": "continue_downstream"}},
  {"id": "cleanup", "command": {"kind": "run", "command": ["rm", "-f", "$diff_file"]},
   "depends_on": ["lint"]}]}
JSON
)"
```

要用另一条命令（判定、摘要工具等）再次处理任务结果，并将处理后的内容作为结果，可添加 `postprocess`。主任务成功后执行该命令，并将其标准输出作为任务结果。

```json
{"id": "judge",
 "command": {"kind": "run", "command": ["make-draft"]},
 "output_schema": {"type": "enum", "values": ["pass", "revise"]},
 "postprocess": {"command": ["judge-cli", "--json"],
                 "stdin": {"draft": {"from": "raw", "pointer": "/execution/stdout/text"}},
                 "stdout": {"pointer": "/verdict"},
                 "timeout_ms": 120000,
                 "retry": {"max_retries": 1}}}
```

- 命令不经 Shell，直接执行。需要 Shell 时，需显式填写，如 `["sh", "-c", "..."]`。登录信息沿用启动 Tasty 时的环境。但如果在 Claude Code 内启动 Tasty，则不传递指向该会话的变量（与终端相同）。如果从另一个 Tasty 的终端启动，也不传递 `TASTY_SURFACE_ID` 等指向那个 Tasty 终端的变量。
- `stdin` 指定写入标准输入的 JSON 字段。`from` 为 `input`（任务输入）或 `raw`（主任务结果），用 `pointer` 选择其中的值。
- 标准输出默认必须是单个 JSON 值。使用 `"stdout": {"format": "text"}` 时按原文接收。将进度日志输出到标准错误即可避免混入结果。
- `cwd` 指定后处理命令的工作文件夹。省略时使用主任务的 `cwd`，若也未设置，则使用启动 Tasty 时的文件夹。
- 必须填写 `timeout_ms`。超时或取消任务时，会终止该命令及其启动的进程。
- 设置 `retry` 后，失败时只按指定次数重新执行后处理，不重新执行主任务。`max_retries` 为 1~10，`delay_ms` 指定重新执行前的等待时间（默认 0，最大 3600000）。次数耗尽后任务失败，后续任务与普通失败一样遵循失败策略。无法单独重新执行后处理。需要重试时，用 `task-retry` 从主任务开始重新执行。
- 指定了类型的任务运行时，`task-list` 行末和 `task-get` 的 `phase:` 行会显示阶段。执行主任务时为 `executing`。
- 后处理可添加到 `run`·`custom` 任务，不能添加到 `reduce`·`wait_barrier` 任务。
- 阶段变化不会发送事件。若需要在某个位置收到通知，可在该任务后插入 `run` 任务，例如 `["tasty", "notify", "build finished"]`，或调用 webhook 的 `curl`。
- 后处理结束前，任务显示为运行中，后续任务继续等待。`task-get` 会在 `state: running` 的下一行显示 `phase: postprocessing (run 1)`（等待重试时为 `phase: retry_wait (run 2)`）。
- 后处理失败时，`task-get` 的 `state` 行会显示原因，下方会显示最后一次执行的原因和退出码，如 `postprocess: run 2 failed (nonzero_exit), exit_code 3`，以及进入重试的各次执行的原因（`postprocess retried after: ...`）。若后处理结果过大而无法保存，成功的后处理会从 `task-get` 的原始结果中去掉主任务响应，并保留成功状态。若仍超限，或执行失败，原因为 `result_too_large`，即使还剩重试次数也不会重新执行。
- 后处理运行期间退出 Tasty，会终止该后处理命令及其启动的进程。重新启动后不会再次执行该后处理，任务以失败结束。停止运行器（`task-run --action stop`）也会以同样方式终止后处理，任务会保持显示为运行中，直到再次启动运行器。需要重试时，用 `task-retry` 重新执行任务。
- Tasty 被强制终止时（如 `kill`），行为因操作系统而异。在 Windows 上，后处理命令及其启动的进程会一同结束，在 macOS 上则全部保留。
- 如果重新启动后后处理命令仍在运行（在 macOS 上被强制终止），任务会保持运行中，并持续持有信号量和 lease，直到该命令结束。命令结束时因无法接收结果而将任务判为失败，此时才释放资源。如果只剩该命令启动的其他进程，则不等待。等待后处理的任务（包括等待重试的任务）会持有资源，并按计划执行后处理。

Tasty 无法打开记忆文件而使用[临时记忆](cli-reference.md#智能体共享的记忆)时，图无法在重启后保留，因此直接提交会被拒绝。对于允许重启后丢失的图，添加 `"durability": "best_effort"` 后提交。

### 根据结果选择下一任务

为任务设置 `transitions` 后，会根据该任务的结果选择接下来执行的任务。以下示例中，`review` 的判定为 `pass` 时只执行 `ship`，为 `revise` 时只执行 `fix`，否则只执行 `human`。

```json
{"id": "review", "command": {"kind": "run", "command": ["review-tool"]},
 "output_schema": {"type": "object", "fields": {
   "verdict": {"type": "enum", "values": ["pass", "revise", "review"]}}},
 "transitions": {
   "cases": [
     {"when": {"compare": {"path": "/verdict", "op": "eq", "value": "pass"}}, "to": ["ship"]},
     {"when": {"in": {"path": "/verdict", "values": ["revise"]}}, "to": ["fix"]}],
   "otherwise": ["human"]}}
```

- 条件将结果中的一个位置（`path`）与值比较（`compare`：`eq`·`ne`·`lt`·`le`·`gt`·`ge`），或检查其是否属于值列表（`in`）。可用 `all`·`any`·`not` 组合。与结果类型不匹配的条件会在提交时被拒绝。小数只进行范围比较。
- 在收集结果的 `reduce` 任务（策略为 `all`）中，可向条件添加 `"input": "<输入任务 id>"`，以该输入任务的结果类型读取其结果，而非汇总后的结果。
- 默认只能有一个条件匹配。匹配两个或更多条件时，该任务以失败结束。要执行所有匹配项，添加 `"mode": "all_matches"`。
- 必须指定无条件匹配时执行的任务（`otherwise`），或不执行任何任务（`"no_match": "finish"`）。
- 未选中的任务及只能从这些任务到达的后续任务，会以“未选中”结束，而不是失败。分支重新汇合的任务只等待实际执行的分支。实际执行的分支失败时，失败仍会向后传递。
- 若将可能不执行的分支结果作为必需输入，提交时会被拒绝。若各分支由不同任务产生值，用 `one_of` 接收；若值可以缺失，则将输入字段设为 optional 或提供默认值。
- 任务的 `route` 会记录选中的任务，未选中任务的 `skip` 会记录原因。所有任务都成功或未选中时，DAG 显示为成功。失败任务若由回退任务代替并成功，也不会使 DAG 失败。
- 即使一个分支失败，只要其他分支仍可继续，DAG 就会显示为进行中状态（运行中、就绪、等待中）。结果变得未知（`unknown`）的任务必须重新执行或取消后才能继续，因此不计为进行中。全部结束时，若存在成功执行到最后的分支，DAG 状态为 `partially_failed`（部分失败），否则为 `failed`。只有前序任务成功、最后任务失败或被跳过的单线流程为 `failed`。最后任务虽失败，但由回退任务代替并成功时，计为成功。该状态显示在 `agent dag-list` 的 `rollup_state` 中，并在任务 DAG 列表和 DAG 标签页中以 `◒` 标记和**部分失败** <!-- en: Partially failed --> 标签显示。

### 让智能体执行任务并将回答作为结果

`agent` 任务向 Claude 或 Codex 等智能体会话发送一条指令，并将回答作为任务结果。结果可直接用于下一任务的输入或上面的分支条件。

```json
{"id": "review",
 "command": {"kind": "agent", "provider": "claude", "workspace_id": 2,
             "session": {"kind": "existing", "surface_id": 12},
             "instruction": "请评审此分支的更改",
             "timeout_ms": 1800000},
 "output_schema": {"type": "enum", "values": ["approve", "revise"]}}
```

- `provider` 是负责会话的插件名称。Claude 插件为 `claude`，Codex 插件为 `codex`，支持智能体任务的其他插件也可使用各自的名称。若插件未安装、已关闭或没有轮次报告权限，创建任务时会被拒绝并说明原因。创建后关闭插件，则该任务会在执行时失败。
- `command` 中的 `workspace_id` 是新会话所在的工作区。提交值的 `task-submit` 会发往任务所在的工作区，指令末尾附加的说明中包含该编号。
- `session` 为 `{"kind": "new", "parent_surface": <Surface>}` 时，在该 Surface 下启动新会话并发送指令。添加 `"cwd": "<路径>"` 可指定新会话的工作文件夹。为 `{"kind": "existing", "surface_id": <Surface>}` 时，发送到已打开的会话。
- 已打开的会话仅在空闲时接收指令。若正在直接对话，会等到对话结束，以免混合对话。指令末尾会附加一行用于识别该次执行的标记，只有由该标记发起的轮次才视为任务轮次。使用同一会话的任务会依次执行。
- 未指定结果类型时，该轮次的最后回答会成为字符串结果。
- 若为 Claude 会话设置了 Stop Gate，在 Gate 要求继续响应期间，轮次不会结束。Gate 允许结束响应后，以最后回答完成任务。若需要对指令的首次回答，指定结果类型并要求通过 `task-submit` 提交。
- 如上例指定结果类型后，智能体必须通过 `tasty agent task-submit` 提交值。指令末尾会自动附加提交方法、类型和仅用于本次执行的令牌。令牌不同的值不会被接收，因此不会混入误交给其他任务或以往执行的值。提交的值会立即检查，并在轮次结束时成为结果。`revise` 等判定也是成功的结果。
- 接收输入的任务需设置 `"input_mapping": {"input_block": true}`。输入会以 JSON 附加在指令后。
- 未给出回答就结束轮次、轮次因错误结束、会话结束或超过 `timeout_ms` 时，任务失败。失败原因会在 `task-get` 的结果中分别显示。若未提交值就结束轮次，失败记录会保留该轮次最后回答的前 2000 个字符。
- 智能体等待权限批准等输入时，任务保持运行中，`task-get` 会显示 `phase: awaiting_input` 行和 `agent session: claude surface 12, awaiting input since …` 行。
- Tasty 繁忙时，即使向已有会话发送指令后的响应延迟，也不会重新发送指令。为避免同一指令发送两次，会等待延迟的响应，只有确定尚未发送时才重新发送。若无法确定是否已发送，任务会变为 `unknown`，而不是失败。确认会话是否收到指令后，再重新执行或取消。
- 任务完成或取消后，会话也不会关闭。重启 Tasty 后，正在运行的 agent 任务会以失败结束。正在等待指令已发送响应的任务会变为 `unknown`。
- 等待新会话启动期间，其他任务仍会继续。新会话未在 30 秒内启动时，任务失败。之后延迟启动的会话会由任务关闭。等待期间取消任务，也会关闭延迟启动的会话。不会关闭原本已打开的会话。等待期间重启 Tasty，任务会变为 `unknown`。
- 在网络被阻断的沙箱中运行 Codex 时，`task-submit` 无法连接 Tasty，因此指定了结果类型的任务会失败。未指定结果类型的任务（以最后回答为结果）不受影响。
- 要将已有任务的结果自动传递给父 Codex，参阅[自动传递给父 Codex](claude-codex.md#自动传递给父-codex)。

### 示例：实现、评审、根据判定分支并重新汇合

此图将上述功能组合起来。`implement` 用文字描述更改，`review` 将该文字作为输入，输出判定和置信度。置信度不低于 0.9 的 `pass` 进入 `ship`，置信度不低于 0.9 的 `revise` 进入 `fix`，其余进入 `human_review`，三个分支在 `report` 重新汇合。将 `make-change`·`review-tool` 替换为各自的工具。要交给智能体执行，替换为上面的 `agent` 任务。

```json
{"contract_version": 2,
 "types": {"ReviewResult": {"type": "object", "fields": {
   "verdict": {"type": "enum", "values": ["pass", "revise", "review"]},
   "confidence": {"type": "float64", "min": 0, "max": 1}}}},
 "tasks": [
  {"id": "implement", "command": {"kind": "run", "command": ["make-change"]},
   "output_schema": {"type": "string"},
   "postprocess": {"command": ["summarize-tool"], "timeout_ms": 10000,
                   "stdin": {"text": {"from": "raw", "pointer": "/execution/stdout/text"}}}},
  {"id": "review", "command": {"kind": "run", "command": ["review-tool"]},
   "input_schema": {"type": "object", "fields": {"summary": {"type": "string"}}},
   "bindings": {"summary": {"from_task": "implement"}},
   "input_mapping": {"args": ["/summary"]},
   "output_schema": {"ref": "ReviewResult"},
   "transitions": {"cases": [
     {"when": {"all": [{"compare": {"path": "/verdict", "op": "eq", "value": "pass"}},
                       {"compare": {"path": "/confidence", "op": "ge", "value": 0.9}}]}, "to": ["ship"]},
     {"when": {"all": [{"compare": {"path": "/verdict", "op": "eq", "value": "revise"}},
                       {"compare": {"path": "/confidence", "op": "ge", "value": 0.9}}]}, "to": ["fix"]}],
     "otherwise": ["human_review"]}},
  {"id": "ship", "command": {"kind": "run", "command": ["ship-tool"]}},
  {"id": "fix", "command": {"kind": "run", "command": ["fix-tool"]}},
  {"id": "human_review", "command": {"kind": "run", "command": ["notify-reviewer"]}},
  {"id": "report", "command": {"kind": "run", "command": ["report-tool"]},
   "depends_on": ["ship", "fix", "human_review"]}]}
```

`review` 以置信度 0.95 给出 `pass` 时，`task-get` 显示如下。

```text
state: succeeded
route: ship
attempt: review#1
revision: 7
input: summary <- implement (attempt implement#1)
output: {"confidence":0.95,"verdict":"pass"} (from postprocess.stdout.json)
```

- `input:` 行显示接收了哪个任务第几次执行的结果，`output:` 行显示结果来源。未产生结果就结束的任务会显示 `output: none`，并在 `error:` 行显示失败阶段和原因。
- `fix`·`human_review` 以 `skip: branch_not_selected` 结束，`report` 只等待实际执行的 `ship`，然后成功结束。
- `review` 失败时，三个分支和 `report` 都会被跳过，并显示原因任务，如 `skip: upstream_unavailable (review failed)`。
- 每次保存任务记录时，`revision` 都会增加。可用于判断同一任务的两次查询结果中哪次更新。
- `confidence` 是任务在结果类型中声明的值，因此可用于分支条件。终端状态查询返回的 `confidence` 表示对会话状态判断的确定程度，与此值不同。

未指定类型的任务也可在同一工作区中一起使用。通过 `task-create --depends-on report` 创建的任务，会在 `report` 结束后执行。但若试图通过 `${task.review.output}` 等占位符读取指定了类型的任务结果，创建时会被拒绝。要传递结果，需将接收任务也放入图中，并通过 `bindings` 接收。

## 保存和查看运行记录

指定了类型的任务组会留下供之后阅读的运行记录（report）。每个任务都有 Tasty 自动填写的部分，以及任务在运行期间自行写入的备注。

- 自动部分：最终状态、开始和结束时间、实际接收的输入和输出的结果、失败时的阶段和原因、跳过时的原因。Shell 命令还会显示退出码，智能体任务会显示使用的会话，结果收集任务会显示方法和输入数量。
- 备注：Shell 命令任务、处理其结果的后处理命令，以及自行编写的结果收集 Shell，都会接收环境变量 `TASTY_TASK_REPORT`。在其中使用 `tasty agent report append '跳过了 3 个测试'` 等命令写入。此命令成功时不输出任何内容，不影响任务结果，仅在失败时将原因写入标准错误。Shell 命令也可向标准错误写入以 `::tasty-report::<备注>` 开头的行（该行也会原样保留在标准错误中）。智能体任务的指令末尾会附加用于阅读备注写入方法的命令（`tasty agent report usage`）和地址。

```sh
#!/bin/sh
# 在 Shell 命令任务内
 tasty agent report append "检查了 $(ls src | wc -l) 个文件"
echo "::tasty-report::重建了缓存" >&2
```

只在任务运行期间接收备注，结束后写入会被拒绝。单条备注超过上限（默认 1 KiB）时，会被截断并附加截断标记。单次执行的备注总量超过上限（默认 16 KiB）后，不再保存后续备注，只统计数量。两种情况都不会使命令失败。两个上限可在**设置** › **其他** › **任务流水线** <!-- en: Task pipeline --> 中更改。重新执行（`task-retry`）时，各次执行的备注分别收集。备注仅用于记录，不能作为后续任务的输入（`bindings`）。

```sh
tasty agent dag-report d:review-loop                       # 整个任务组
tasty agent dag-report d:review-loop --task build --attempt 2   # 单个任务的第二次执行
tasty agent dag-report d:review-loop --include-raw         # 同时包含标准输出和标准错误
```

DAG id 可通过 `tasty agent dag-list` 查看。重新执行（retry）过的任务，其先前执行也会显示最终状态、备注，以及开始重新执行时保存的自动部分。

## 查看进度

任务图是查看进度的界面。通过 CLI 创建和更改任务。可同时查看节点的执行状态和任务留下的结果。

有两个界面可查看任务流程。两者使用相同的数据。

- **任务 DAG** <!-- en: Task DAGs --> 窗口 — `Ctrl+Shift+G`（Mac 预设中为 `Cmd+Shift+G`），或侧边栏的**工具** <!-- en: Tools --> 菜单。用于从列表中选择一个 DAG，简要查看后关闭。支持搜索和状态筛选。选中后，同一区域会切换为图，最上方一行的返回箭头旁有放大、缩小、适应全图、切换方向和运行器标记。
- **DAG 标签页** — 占用一个标签页并保持打开的图。通过 `tasty new tab --pane <ID> --type dag_graph` 打开，或在已有 Surface 中按 `Alt+'` 切换为 **DAG**。支持放大、缩小、适应全图和切换方向，点击节点可查看命令、依赖、耗时、退出码和输出。

图中的线条形状因关系而异。仅关联顺序的依赖为实线，接收输入的连接（`bindings`）为青绿色点划线，根据结果选择的分支（`transitions`）为紫色虚线。选中的分支会加粗。未选中或不执行的路径用中性色绘制，不降低不透明度，并保留关系对应的实线、点划线或虚线。两个任务之间同时存在顺序依赖和输入连接时，只绘制输入连接。因未选中而跳过的任务会附加**未选中** <!-- en: Not selected -->。将鼠标悬停在节点上，会显示任务名称和状态；已跳过、结果未知或等待输入的任务还会多显示一行原因。`task-graph --format dot` 也采用相同区分。

节点左上角的小图标表示任务种类。Shell 命令为终端，内部调用为插头，结果收集为叠层，等待为锁，交给 Claude 或 Codex 的单个轮次为对话气泡。Claude 和 Codex 使用相同的对话气泡，点击节点可在详情中查看具体是哪一种。

运行中的任务会根据正在执行的操作显示不同状态。Claude 或 Codex 会话等待人工回答时，整个节点会变黄，并显示 `!` 标记、**需要输入** <!-- en: Needs input --> 标签和已等待时间。点击该节点，详情中有**打开会话** <!-- en: Open session --> 按钮，点击即可跳转到该会话的标签页，直接回答。从任务 DAG 列表中点击时会关闭列表。列表中，存在等待输入任务的 DAG 行也会附加 `! 1 needs input`。正在后处理结果或等待重试的任务会保留运行中的颜色，并显示第几次执行，如**后处理 · 第 1 次运行** <!-- en: Postprocess · run 1 --> · **等待重试 · 第 2 次运行** <!-- en: Retry wait · run 2 -->。

列表各行和 DAG 标签页最上方一行会显示已结束任务数/总数。若有跳过的任务，会在后面显示跳过数量，如 `· 2 skipped (1 not selected)`；若其中有因分支未选中而跳过的任务，则在括号中显示该数量。

一个工作区中可运行多个互不相关的图。列表将通过依赖关系连接的任务组显示为一个 DAG。为任务添加 `--metadata '{"dag":"名称"}'` 后，无论是否相连，同名任务都会归为一组。

| 状态 | 含义 |
|---|---|
| **等待中** <!-- en: Waiting --> | 依赖的任务尚未结束 |
| **就绪** <!-- en: Ready --> | 已满足执行条件，正在等待运行器 |
| **运行中** <!-- en: Running --> | 正在运行 |
| **成功** <!-- en: Succeeded --> · **失败** <!-- en: Failed --> | 已结束 |
| **已取消** <!-- en: Cancelled --> · **已跳过** <!-- en: Skipped --> | 人工取消，或因前序任务失败而跳过 |
| **未选中** <!-- en: Not selected --> | 分支选择了其他路径，因此未执行。不属于失败 |
| **需要输入** <!-- en: Needs input --> | 正在运行的 Claude·Codex 会话等待人工回答。DAG 状态仍为运行中 |
| **未知** <!-- en: Unknown --> | 无法确定结果。点击节点可在详情中查看原因。命令在 Tasty 重启期间结束，或重启后继续监视的命令随后结束，未能收到退出码（重启后的 Tasty 无法接收该命令的退出码）。后续任务会等待，必须重新执行（`task-retry`）或取消后才能继续。持有信号量和 lease 的任务也相同。命令仍在运行时，会持续持有资源，直到结束后才释放 |

要在终端中查看：

```sh
tasty agent dag-list                                   # 所有工作区的 DAG
tasty agent task-list --workspace 2 --state waiting,ready,running
tasty agent task-get --workspace 2 --id "$BUILD"
tasty agent task-graph --workspace 2 --format dot   # 用 Graphviz 绘制
```

`tasty agent task-graph` 和 `tasty agent dag-get` 默认输出父 ID 表。通过 `--format table|json|dot` 选择格式，默认值为 `table`。要在脚本中按 JSON 读取输出，添加 `--format json`。在旧版本中将默认输出解析为 JSON 的脚本也必须添加此选项。

表格使用 Markdown 风格的管道符（`|`）分隔列，列顺序为 `id`、`parents`、`name`、`state`。存在多个父任务时，`parents` 用逗号连接；没有父任务时显示 `-`。值中的 `|` 转义为 `\|`。表格的 `parents` 列列出每条边的起点，不区分边的类型。要查看边的类型，使用 `--format json` 或 `--format dot`。没有任务时，仅输出两行表头，退出码为 0。

`--format dot` 只向标准输出写入可直接传给 Graphviz 的图（如 `... --format dot | dot -Tsvg > graph.svg`）。使用 `--format dot` 或表格输出时，存在环的提示和运行器状态行均输出到标准错误。`dag-get` 也相同。

`task-list` 和 `task-get` 输出供人阅读的文本行。要在脚本中使用，或查看任务接收的输入（`input_snapshot`）和原始结果（`typed_result.raw`），添加 `--json`。Tasty 返回的响应会原样以 JSON 输出。

<a id="等待和调整"></a>

## 等待和管理任务

```sh
tasty agent task-await --workspace 2 --id "$TEST"             # 等待完成
tasty agent task-retry --workspace 2 --id "$TEST"             # 重试失败、已取消、已跳过或未知的任务
tasty agent task-cancel --workspace 2 --id "$TEST"
tasty agent task-set-result --workspace 2 --id "$MANUAL" --state succeeded
tasty agent task-purge --workspace 2 --states succeeded
```

即使丢失保存响应，重新核对完成记录后，也会恢复待发送的完成通知。无限期等待也会收到已确认的完成结果。保存结果未知的请求不会被改为成功，也不会为确认结果而重新执行命令。同一完成事件可能跨重启重复传递，处理事件的工具应使用 `terminal_id` 去重。无法读取完成记录时，会先保留，待下次任务变更或重启时再次核对。

运行器关闭期间取消的任务，即使已收到完成通知，也会继续清理执行。即使先处理了其他任务的响应，也不会遗漏被取消命令及其下游任务的清理。只有确认终止后才释放占用。

- `task-await` 默认最多等待 10 分钟，期间未结束则以超时返回。`--timeout-ms 0` 表示无限期等待。
- `task-await` 响应的 `outcome` 为 `terminal`（已结束，`state` 为 succeeded·failed 等）、`timed_out`（超时）、`not_found`（任务不存在）之一。三者的退出码均为 0，因此不要用退出码判断成功，应读取 `outcome` 和 `state`。根选项 `--response-timeout-ms` 仅表示等待响应的时间，不是任务等待时间。
- 用 `tasty agent barrier-state` 查看屏障状态。命令立即返回，不等待屏障关闭。旧名称 `barrier-await` 也返回相同结果。
- 指定了类型的任务，若回退已执行，则 `task-retry` 会被拒绝。因为主任务再次成功后，接收两者之一的后续任务会看到两个值。要重新运行，需作为新任务提交。
- 因路径未选中而跳过的任务（**未选中**）会拒绝 `task-retry`，因为再次运行仍会因相同原因立即跳过。
- 指定了类型的任务不能使用 `--reset-downstream`。后续任务已按先前执行的失败或所选路径结束。`task-retry` 只重新执行该任务。要连同后续任务一起重新运行，需提交新图。
- `task-set-result` 用于告知运行器未执行的操作已完成，例如人工检查步骤。
  - 指定了类型的任务每次执行都会获得执行轮次 ID（`<任务 ID>#<编号>`）。用 `--attempt-id` 指明结果所属轮次，若期间任务已重新执行，旧报告会被拒绝，不会结束新执行。
  - 重复发送相同报告时，会返回与首次相同的响应。向已结束的轮次发送不同结果会被拒绝。
- 用 `task-cancel` 取消正在运行的命令任务时，会终止该命令及其启动的进程。即使命令已结束，但其启动的进程仍持有输出，导致任务显示为运行中，也会终止这些进程。已关闭输出但仍保留的守护进程，在任务结束后不再视为任务的一部分。确认结束后才会释放信号量和 lease，因此等待同一资源的任务会在前一命令真正结束后才启动。即使运行器已关闭，取消也会立即开始终止操作。此时取消命令会立即返回，不等待终止完成，信号量和 lease 会在确认结束后释放。若在此之前用 `task-retry` 重新执行，任务会保持就绪状态，直到运行器确认前一轮次的所有进程都已结束。此时 `task-list` 会在行末显示 `(waiting_previous_attempt)`，`task-get` 会显示 `phase: waiting_previous_attempt` 行。即使之前取消操作的清理延迟到达，也不会影响正在重新执行的新轮次及其资源占用。
- `task-delete` 在任务仍被其他任务引用时会拒绝删除，并告知引用方的 ID。正在运行的任务必须先取消。尚未确认已取消任务的进程结束时，也会拒绝删除。确认结束并释放信号量和 lease 后才可删除。`task-purge` 会跳过此类任务，并通过响应中的 `skipped`·`skipped_count` 告知。

## 以事件形式接收完成的任务

无需反复查询任务是否结束，可在任务完成时直接接收。

```sh
tasty events follow --filter 'agent.*'
```

每行以 JSON 输出一个事件，可在 Shell 中直接接收使用。

```sh
tasty events follow --filter 'agent.*' | while read -r line; do
  echo "事件：$line"
done
```

- **读取位置由接收方保存。** 将响应中的 `next_offset` 用作下一次的 `--offset`，即可从中断位置继续。只读取一次时，使用 `tasty events fetch --offset <编号>`。
- 事件只保存在内存中，且仅保留最近的事件。断开时间过长，期间的事件被淘汰时，**不会静默地从头提供**，而会告知无法提供的事件数量。该通知与事件列表分开输出，因此不会干扰上面的 `while read`。
- 重启 Tasty 后，事件会消失，位置也会从头编号。若响应中的 `epoch` 与上次不同，保存的位置属于重启前的运行。
- 连接断开时，`follow` 会告知重新连接时应传入的 `--offset` 和 `--epoch`，然后退出。原样添加这些参数重新执行后，如果期间 Tasty 已重启，会提示重启，并从新事件的起点开始接收。指定 `--reconnect` 后不会退出，而是每 1 秒重新连接并继续。
- 目前输出的事件有**任务结束时**和**屏障关闭时**两种。任务事件除状态外，还包含执行轮次（`attempt_id`）、记录版本（`revision`）和跳过原因（`skip`，若由前序任务导致，还包含该任务及其状态）。事件不包含失败原因，需用 `tasty agent task-get` 查看。
- 不会为读取缓慢的接收方持续扩充独立队列。落后于最近事件的共享保留范围时，需检查遗漏。

## 并发限制和信号

同时提供运行多个任务时使用的协调机制。

| 机制 | 用途 |
|---|---|
| 信号量 | 指定带有相同名称的任务最多可同时运行多少个。创建任务时可用简写 `--concurrency-limit <名称>`。与租约一样，运行器监视任务期间会持续延后任务所附信号量的到期时间 |
| 屏障 | 阻塞直到收齐指定数量的信号。以 `wait_barrier` 任务插入图中 |
| 租约 | 让文件等资源一次只由一个持有者占用。有到期时间，冲突时会失败或立即返回未获取的响应，不会等待。任务所附租约（`metadata.lease`）的到期时间会在运行器监视任务期间持续延后，因此长时间运行的任务也不会中途失去租约。运行器关闭期间不会延后。附加到任务的有效期必须至少为 1 秒。如果仍在延后前过期，且租约被其他方获取，`task-get` 会显示 `warning:` 行。该行只显示当前执行轮次的情况，因此重新执行后不会显示前一轮次的警告 |
| 归约器 | 将多个任务的结果合并为一个。可选择仅首次成功、全部、JSON 合并、文本拼接，或用 `custom:<Shell 命令>` 自行合并。该命令从标准输入接收 JSON 数组形式的输入结果；标准输出为 JSON 时将其值作为结果，否则按原文作为结果 |
| 速率限制 | 按智能体和指标指定在规定时间内最多允许多少次 |

```sh
tasty agent semaphore-create --workspace 2 --name build --permits 2
tasty agent barrier-create --workspace 2 --name ready --count-required 3
tasty agent lease-acquire --workspace 2 --resource file:/tmp/db --holder agent-a --ttl-ms 60000
tasty agent task-reduce --workspace 2 --inputs "$A,$B" --strategy all --extract-path /stdout/text
```

信号量和屏障名称只允许使用小写英文字母、数字、`.`、`_`、`-`。包含其他字符时，命令会拒绝执行，并指出有问题的字符。租约的资源名称不受此限制。

完整列表见 `tasty agent --help`。

<a id="接下来阅读"></a>

## 相关阅读

- [使用 tasty CLI](cli.md) — 智能体使用的各类命令
- [Claude · Codex](claude-codex.md) — 启动子智能体并接收通知
- [钩子、通知和 webhook](hooks-notifications.md) — 在命令结束时接收通知

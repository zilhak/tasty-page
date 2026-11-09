<!-- source-hash: 587f7c7f1a17 -->
# CLI 响应延迟和连接诊断

本页用于诊断 `tasty` 命令响应缓慢、无法连接或以 `Error (-32061)` 等错误结束的问题。内容包括响应等待上限与任务等待时间的区别、各错误代码的处理方式、查看当前 Tasty 支持的功能，以及通过 `tasty list pressure` 查看连接数、请求队列和数据库状态。首次使用 CLI 时，先阅读[使用 tasty CLI 操作终端](../agents/cli.md)。

## 区分响应等待和任务等待

- `tasty --response-timeout-ms MS <命令>` 是 CLI 等待 Tasty **响应**的时间上限。写在命令前。
- `tasty agent task-await --timeout-ms MS` 是等待**任务**结束的时间。省略时为 10 分钟，`0` 表示无限等待。结果通过响应中的 `outcome` 返回，超时的退出码也是 0（[等待和管理任务](../agents/tasks.md#等待和管理任务)）。
- `tasty pty state` 和 `tasty agent barrier-state` 不等待，直接返回当前状态。要等待，需再次调用。

同时指定这两个时间时，如果响应等待上限短于任务等待时间，CLI 会在任务结束前以 `Error (-32061)` 结束。将响应等待上限设得比任务等待时间长。

## 设置响应等待上限

```sh
tasty --response-timeout-ms 5000 read screen --surface 42
```

`--response-timeout-ms` 写在命令**前**。在该时间内未收到响应时，命令以 `Error (-32061): …` 结束。此错误表示**结果未知**——请求可能仍在 Tasty 内继续执行，因此，如果命令会更改某些内容，需先检查状态再重新发送。如果时间耗尽时请求仍在 Tasty 内排队，则以 `Error (-32067): …` 结束。此时**未执行任何操作**，可原样重新发送。不传此标志或传入 `0` 时，无上限地等待。

仅可用于通过单个请求完成的命令。对于 `events follow` 等反复查询的命令，或远程附加等打开连接的命令，传入此标志时会以退出码 2 拒绝，且不发送任何内容。

不会向不支持此上限的旧版 Tasty 发送请求。此时命令向 stderr 写入一行 `{"error":{"kind":"unsupported_capability",…,"sent":false}}`，并以退出码 1 结束（[查看当前 Tasty 支持的功能](#查看当前-tasty-支持的功能)）。这项检查也计入同一时间上限——如果 Tasty 卡住，连检查也未能按时完成，则不发送请求，并以 `Error (-32067): …` 结束，此时也可原样重新发送。

## 查看当前 Tasty 支持的功能

`list info` 还会通过 `capabilities` 返回当前 Tasty 支持的功能。名称与版本成对返回，可在此查看仅凭版本字符串无法判断的内容——即使版本相同，不同构建配置支持的功能也可能不同。忽略不认识的名称即可。

如果命令以包含 `"sent":false` 的单行错误结束，表示连接的 Tasty 是不支持该功能的旧版，因此未发送请求。`capability` 中的名称表示缺少哪项功能。

## 各类错误的处理方式

- **出现包含 `"sent":false` 的单行错误**——连接的 Tasty 是不支持该功能（指定读取位置、响应等待上限等）的旧版。未发送请求。`capability` 中的名称表示缺少哪项功能。
- **`Error (…)` 行下附有 `data: {…}` 行**——Tasty 同时发送了失败分类（例如，记忆存储失败的 `storage_failure`、拒绝原因的 `reason`）。`data: ` 后是单行 JSON，脚本可根据此值而非首行进行分支处理。无论有无此行，首行 `Error (代码): 消息` 都相同。`tasty events follow` 和 `tasty plugin audit-follow` 也会附加此行，这两个命令的首行保持 `Error: Error (代码): 消息` 的形式，前面多一个 `Error: `。
- **以 `Error (-32603): memory writer queue is full …` 结束**——记忆存储请求同时大量涌入，Tasty 未接收此请求（`data` 中的 `storage_failure` 为 `busy`）。未保存，可稍后再次调用。`memory writer is not accepting requests` 表示 Tasty 正在退出。
- **使用会话令牌的智能体请求以 `Error (-32000): host is busy: the request gate could not reach the memory writer …` 结束**——Tasty 未能将接收请求前执行的会话判定放入存储队列（`data` 中的 `storage_failure` 为 `busy`）。请求未执行，可稍后原样再次调用。`Error (-32000): host is shutting down` 表示 Tasty 已开始退出，未执行请求。不带令牌调用的 CLI 命令不经过此检查。
- **记忆或智能体协作命令以包含 `"outcome":"unknown"` 的错误结束**——Tasty 也无法确认保存是否完成。重新发送同一请求前，先用 `tasty memory get` 等检查值。即使在等待响应时中止命令，已接收的存储请求也不会取消。
- **以 `Error (-32065): …` 结束**——Tasty 待处理的请求积压，未接收此请求。请求未执行，可稍后原样再次调用。
- **以 `Error (-32066): …` 结束**——连接后 20 秒内未发送请求，Tasty 已关闭连接。未执行任何操作。如果工具直接打开套接字，应在连接后立即发送请求。已发送过一次请求的连接，即使请求之间长时间暂停，也不会关闭。

## 请求处理规则

使用会话令牌的智能体调用限额不仅适用于普通命令，也适用于插件命令和完整列表查询。获准的请求计入调用量一次，超出限额则返回错误，不执行请求。不带令牌的本地 CLI 保留原有豁免。

插件 namespace 调用仅启动已启用的所属插件，以及相应 IPC 钩子所需的活动扩展。不会启用已停用的插件，也不会启动无关插件。不存在的 namespace 不会启动任何内容；已知 namespace 内的方法名拼写错误，可能在启动所属插件后返回错误。

结构更改请求超出队列或存储预算上限时，返回 `-32065` 错误。如果其他请求暂时占用存储预留额度，导致可用额度不足，则在限额内等待。使用同一幂等键发送不同请求时，返回 `-32063` 错误。

一个窗口的结构更改等待外部操作完成期间，明确指定其他窗口的独立结构更改请求仍可继续。同一目标范围内的请求保持顺序。

## 检查响应延迟和连接状态

`tasty list pressure` 显示请求等待及处理时间、连接数和拒绝原因。
各项测量对象不同，不要将请求数相减来计算拒绝数。
累计值从实例启动后开始累积，尚无测量记录的平均值为 `null`。
当前用量和配置值在下文分别说明。

| 耗时项 | 测量对象 |
|---|---|
| `queue_before_gate` | 在队列中的等待时间。也包括之后被权限检查拒绝的请求 |
| `handler_after_gate` | 通过检查并实际处理的请求耗时 |
| `plugin_round_trip` | 发往插件且已收到响应的请求等待时间 |
| `db` | 数据库 commit 和 WAL checkpoint 的耗时、单次 commit 保存的写入数，以及单独统计的 VACUUM |

队列等待时间长时，检查是否有请求积压；处理时间长时，检查哪些命令耗时较长。
插件等待时间长时，查看相应插件的日志。DB 耗时是调查存储操作和争用的依据，
但不能仅凭此值断定磁盘存在问题。commit 时间也包含在处理时间内，
两者相加会重复计算。`checkpoints_busy` 是因其他连接而未能
完成 checkpoint 的次数。`writes_per_commit` 是单次 commit 保存的写入数分布，
不计入 commit 数的数据库压缩（VACUUM）通过 `vacuums` 单独统计。
`memory_writer` 是汇集并处理存储请求的队列的接收数、拒绝数和批次数。
`state_writer` 和 `state_db` 是保存最近文件和教程进度的队列的相同计数及 commit 时间。
在无界面运行或未能打开 `state.db` 的运行中，这些值为 `null`。

存储队列的 `batch_wait` 是批次执行前的等待时间，`batch_execution` 是包含重试等待在内的批次处理时间，`executor_execution` 是实际处理调用的时间分布。单位为微秒，`samples` 为 0 表示尚未观测。`queued_items`、`queued_bytes` 仅统计尚未交付执行的队列内容。`pending_bytes` 和 `oldest_pending_age_us` 分别是未完成请求的输入大小和最早请求已持续的时间。没有未完成请求时，持续时间为 `null`。已完成但尚未读取结果的请求仍可能占用 `held_bytes`。此持续时间并非文件未保存更改的持续时间，完成数或批次数也不表示实际磁盘 commit 数。

`journal` 在 GUI 和无界面运行中都显示日志操作的接收数、拒绝数、等待数和执行中数量。
操作步骤数不同于用户命令数，字节数是输入大小的估计值。`store` 中的
`physical_commits` 是实际 SQL commit 数，`structural_commits` 是包含结构更改的 commit 数，
`logical_requests` 是已提交的逻辑请求数。时间分布按固定区间累计。
`dirty_age_us` 为 `null` 表示此指标不提供该持续时间。
`unpublished_age_us` 是保存后等待画面反映确认的时间，查询不会清空此值。
实际 SQL commit 失败、需要重新确认提交状态时，`publication_known` 为 `false`，
`unpublished_age_us` 为 `null`。此时保持 unknown，直到重新打开日志并完成验证。
没有日志的测试配置返回 `journal: null`，存储尚未打开时返回 `store: null`。

`file_snapshots.settings` 在 GUI 和无界面运行中都显示已应用到内存的设置与已确认保存的设置之间的差异。`dirty` 为 true 表示尚未确认保存，`dirty_age_us` 是从首次未保存更改起经过的微秒数。新更改、失败、结果未知、重试或较早更改保存成功均不会重置此时间。确认最新更改保存成功后，`dirty` 变为 false，持续时间变为 `null`。失败后，即使 `pending` 为 0，也可能仍有未保存更改。此查询不会提前处理保存完成结果。

`state_snapshots.recent_files` 显示 GUI 最近文件列表是否有尚未确认保存的更改（`dirty`），以及该状态首次开始后经过的微秒数（`dirty_age_us`）。即使更改其他种类的列表，或保存以失败、拒绝、结果未知结束，时间也会继续累计。确认所有种类的最新列表均已保存后，持续时间变为 `null`。此值不单独显示各种类的持续时间，查询也不会收取保存结果。在无界面运行或未能打开状态 DB 的运行中，此列表状态为 `null`。

权限、用量限额和频率限制的拒绝数在下方 `gate_refusals` 中查看。

### 连接数和上限（`connections`）

| 字段 | 含义 |
|---|---|
| `live` | 当前连接数。连接关闭时减少 |
| `live_max` | 启动以来最高的并发连接数 |
| `limit` | 允许的并发连接数上限 |
| `accepted` | 已接收连接数的累计值 |
| `refused_saturated` | 因连接上限而拒绝的累计数 |

尚未发送请求的连接也计入 live。如果 live 接近 limit，或
refused_saturated 增加，清理不再使用的附加等持久连接。
此类拒绝发生在请求处理前，因此不会出现在请求处理时间中。
连接不足和处理延迟也可能同时出现。

`accept_wait_bound_us_max` 和 `accept_wait_bound_us_mean` 分别显示连接接收等待时间
上限的最大值和平均值。`accept_waits` 是记录数，
`accept_wait_bound_us_sum` 是这些上限的总和。这些值并非直接测得的实际等待时间。
从上次连接队列为空的时刻开始计算，因此实际等待可能更短。
确认队列为空后，默认等待 100ms，但 100ms 并非总等待时间的严格上限。
此时间独立于请求队列等待时间，平均值也可能随观测记录累积而下降。

### 耗时分布

只有前三项耗时包含 `wait_us_hist` 或 `us_hist`。
`bounds_us` 是从 10µs 到 1 秒的 11 个区间边界，`counts` 是各区间的数量。
最后一个区间为超过 1 秒，因此 counts 多一项。区间互不重叠，总和为
观测数。最长时间通过该项的 max 值查看。不提供 p99 等分位数。

`queue_before_gate.waits` 是测量了等待时间的命令数，也是计算平均值的分母。
`commands` 只有在一个批次处理结束后才增加，因此可能比 waits 少正在处理的批次所含的数量。
结合平均值和分布，可区分普遍延迟与仅少数请求耗时较长的情况。

### 数据库设置（`db_pragmas`）

分别显示 `memory_db` 和 `state_db` 请求的设置（requested）及实际生效值（effective）。
这些设置在打开 DB 时确认，并非累计计数器。

| 值 | 含义 |
|---|---|
| `degraded: true` | 设置未达到预期状态，或使用临时内存代替文件 DB 运行 |
| `state_db: null` | 此实例未打开状态 DB。无界面运行也使用此值 |
| `memory_db.init_failure` | 未能打开文件 DB 而改用临时内存的原因（cause）和错误（error）。正常时为 null |

即使设置不匹配，DB 仍可继续使用。由于可能影响性能和故障后恢复，
应比较 requested 与 effective。临时内存即使所有设置均已生效，degraded 也为 true，
期间保存的值会在重启后丢失。

### 画面传输（`stream_push`）

| 字段 | 含义 |
|---|---|
| `frames_dropped` | 因接收方跟不上而丢弃的帧数累计值 |
| `clients_lagged_out` | 因延迟过大而断开连接的接收方数量累计值 |
| `backlog` | 当前等待传输的帧数。传输后减少 |
| `sink_capacity` | 单个连接可保留的帧数上限 |

frames_dropped 增加时，附加端可能遗漏了部分画面。
Tasty 附加端收到重新连接请求时，会重新连接并获取新画面。

### 请求队列（`queue_admission`、`queue_dispatch`）

queue_admission 显示入队量和入队前被拒绝的请求。

| 字段 | 含义 |
|---|---|
| `queued_bytes`, `queued_commands`, `queued_injected` | 当前等待的字节数、命令数和内部命令数 |
| `peak_bytes` | 启动以来最大的等待字节数 |
| `limit_bytes`, `limit_injected_depth` | 字节数和内部命令数的上限 |
| `refused_bytes`, `refused_depth` | 因各上限而拒绝的请求数累计值 |

出现队列已满错误时，检查这些值。入队前被拒绝的请求
不计入队列等待及执行时间。

queue_dispatch 显示从队列取出并处理的过程。

| 字段 | 含义 |
|---|---|
| `rounds` | 取出命令进行处理的次数 |
| `rounds_stopped_by_count`, `rounds_stopped_by_time` | 用尽单轮处理数量或时间额度而停止的次数 |
| `expired_before_run` | 在队列中等待时超过请求方时限而未执行的数量 |
| `started` | 已开始执行的命令数 |
| `in_flight`, `in_flight_max` | 已开始执行、但命令或响应等待尚未结束的请求当前数和最大值 |

in_flight 可以减少。即使调用方停止等待，只要命令仍在执行，就会继续计入。如果因时间限制而停止的次数或 expired_before_run 增加，
检查队列处理是否跟不上请求。

创建、重命名、删除分类和调整分类顺序，以及更改工作区信息和顺序时，使用相同重试键发送请求，即使应用重启也会返回首次结果。即使目标之后被移动或重命名，也不会重新选择新目标。重新获取已保存结果时，不会重新应用远程画面的本地显示名称和位置。其他命令并不保证重启后也能防止重复执行。

### 重复请求处理（`keyed_requests`）

仅统计带有幂等键（idempotency_key）的请求，每个请求只计一次。

| 字段 | 处理结果 |
|---|---|
| `executed` | 执行新键对应的请求 |
| `replayed` | 为同一请求返回之前的结果，不再执行 |
| `conflicted` | 同一键对应不同内容，未执行 |
| `discarded` | 已执行，但丢弃响应 |
| `in_flight` | 同一请求正在执行，共同等待其结果 |

如果 replayed 比 executed 增长更快，检查是否在反复重试。
此处 in_flight 的统计方式不同于 queue_dispatch 的当前执行数。

### 慢请求详情（`slow_requests`）

按从旧到新的顺序显示队列等待、宿主处理和插件等待时间之和达到 threshold_us（100ms）的请求，
最多显示 capacity（32）条。超出时从最早的记录开始丢弃。
admitted 是启动以来记录的累计数，与当前保留条数的差值就是被移除的条数。

| 字段 | 内容 |
|---|---|
| `request_seq` | Tasty 分配的编号。与请求的 id 不同 |
| `host` | method, caller, queue_wait_us, host_us, outcome(ok/error), error_code |
| `plugin_hops` | 各插件的 host_request_id、等待时间、ok/error/expired/cancelled 结果 |
| `total_us` | 测量时间总和 |

尚未响应时，host 的 outcome 和 error_code 为 null。
plugin_hops 耗时较长时，在插件日志中查找与 host_request_id 相同的请求 ID。
插件错误和无响应日志会同时显示 id 和 request_seq。
不保存请求正文和令牌，pressure 查询本身也不计入此列表。
重启后记录清空，编号也从 1 重新开始。

### 请求拒绝原因（`gate_refusals`）

judged 是经过权限等检查的请求数，包括 CLI 请求和插件调用。
每个请求最多计入以下一种原因。

| 字段 | 原因和错误代码 |
|---|---|
| `permission_denied` | 被权限检查拒绝，-32001 |
| `cap_blocked` | 达到遥测限额，-32007 |
| `throttled` | 达到调用频率限制，-32010 |

检查权限和用量限额，或等待频率限制解除。
权限拒绝不仅包括权限不足，也包括插件或智能体调用不可用命令或
不存在的命令。后两种情况无法通过请求权限解决，
需检查命令。不带会话令牌的本地 CLI 保留权限豁免。

并非所有 -32001 错误都会计入 permission_denied。
格式错误或未注册、已过期、已撤销的会话令牌在检查前即被拒绝，因此也不计入 judged。
通过检查后由权限授予请求等拒绝所产生的 -32001，也不计入此计数器。
此累计值在重启后归零。`tasty agent rate-limit-status` 的 throttled_count 是
各项限制的持久累计值，因此两者不同。

## 相关阅读

- [故障排除](troubleshooting.md)——安装、连接和钩子问题。
- [使用 tasty CLI 操作终端](../agents/cli.md)——首次使用的顺序和基本模式。
- [CLI 命令参考](../agents/cli-reference.md)——按用途查找入门范围以外的命令。

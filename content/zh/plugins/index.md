<!-- source-hash: 931d3753b399 -->
# 插件

Markdown、图像、HTML 查看及 Claude Code、Codex 集成等功能由插件提供。可以管理内置插件或安装新插件，并查看所需权限。

## 什么是插件

Markdown 查看器、图像查看器、Claude Code 集成等功能由 **插件** 提供，而非 Tasty 本体。插件作为独立进程运行，声明所添加的功能（Surface 种类 · 工具菜单项 · `tasty` 子命令 · 设置页面 · 文件处理器）及所需的 **权限**，Tasty 仅接受已授予权限范围内的请求。

- 安装位置为 `~/.tasty/plugins/<id>/`，日志位于 `~/.tasty/plugins-logs/<id>.log`。
- 内置插件在首次启动时自动安装。之后可以像自行安装的插件一样禁用或卸载。已卸载的内置插件不会在下次启动时重新安装。
- 禁用插件后，该插件添加的 Surface 种类 · 命令 · 菜单项会一并消失。运行期间禁用或卸载也会立即生效，无需重启。尝试打开该种类的新 Surface 时，会因“提供该功能的插件已禁用或尚未重新连接”而无法打开。已打开的 Surface 会保留，重新启用后会继续运行。但会丢失滚动位置和未保存的内容。

启用或禁用插件、更改权限时，会在确认保存结果后应用到运行状态。安装和信任选择也会在保存完成后报告结果。保存失败或无法确认结果时，不会视为成功。关闭期间完成保存的启用操作会在下次启动时生效，关闭过程中不会启动新的插件进程。到关闭截止时间仍未确认结果的更改，不会报告成功或自动重新执行。

## 内置插件

| 插件 | id | 功能 | 使用位置 |
|---------|-----|---------|---------|
| **Markdown 查看器** | `com.tasty.markdown` | 渲染并显示 `.md` 文件的 Markdown Surface。文件更改后自动重新读取 | 右键点击标签栏 > **新建 Markdown…** <!-- en: New Markdown... -->、在文件浏览器中打开 `.md`、`tasty markdown reload` · `recent` |
| **图像** | `com.tasty.image` | 图像查看器兼简易画图工具。可切换到同一文件夹中的下一张 · 上一张图像，并保存为 PNG | **新建图像** <!-- en: New Image -->、打开图像文件、`tasty image open` · `save` · `export` · `next` · `prev` · `paste` · `list` |
| **HTML 查看器** | `com.tasty.html` | 通过内嵌 WebView 显示 HTML、SVG 文件及 URL 的 Surface | **新建 HTML…** <!-- en: New HTML... -->、打开 `.html` · `.svg`、`tasty html open` |
| **剪贴板查看器** | `com.tasty.clipboard-viewer` | 将剪贴板当前内容按文本 · 文件 · 图像 · HTML 分类显示的弹窗。不保存历史记录 | **工具** <!-- en: Tools --> > **剪贴板查看器** <!-- en: Clipboard Viewer -->、`Ctrl+Shift+H` |
| **Git 查看器** | `com.tasty.git-viewer` | 以只读方式显示当前目录仓库的 status · log · diff 的弹窗。有多个 worktree 时，在左侧选择 | **工具** > **Git**，自行指定快捷键 |
| **Claude Code** | `com.tasty.claude` | 在 Tasty 中启动 Claude Code、创建子实例、发送消息并接收完成通知的多智能体命令 | `tasty claude launch` · `spawn` · `tell` … — [与 Claude、Codex 配合使用](../agents/claude-codex.md) |
| **Codex** | `com.tasty.codex` | 为 Codex CLI 提供上述相同功能 | `tasty codex launch` · `spawn` · `tell` … — 同一页面 |

各 Surface 种类的用法见[文件管理与查看](../using/files.md)。此外还有仅包含在开发构建中的演示 · 实验插件，发行版不包含这些插件。

### 插件添加的设置

在 **设置** <!-- en: Settings --> 窗口中，插件页面出现在两处。

- **外观** <!-- en: Appearance --> > **Markdown** — 仅应用于 Markdown Surface 的字体设置 · **允许远程内容** <!-- en: Allow remote content -->（默认关闭，阻止文档加载的外部 http/https 资源）。
- **外观** > **HTML** — **默认缩放** <!-- en: Default zoom -->（%）· **配色方案** <!-- en: Color scheme -->（跟随主题 / 浅色 / 深色）· **允许远程内容** <!-- en: Allow remote content -->（默认关闭，阻止外部 http/https 资源）· **在沙箱中运行脚本** <!-- en: Sandbox scripts -->（默认开启）。
- **插件** <!-- en: Plugins --> > **Claude Code** — **Spawn 子实例警告阈值** <!-- en: Spawn child warning threshold --> · **子无输出时通知父之前的等待秒数** <!-- en: Seconds without child output before notifying the parent -->（`no_output_notice_secs`，默认 600 秒，范围 60~86400 秒）。详细行为见[与 Claude、Codex 配合使用第 4 节](../agents/claude-codex.md#4-接收完成通知)。
- **插件** > **Codex** — **Spawn 子实例警告阈值** · **默认批准策略** <!-- en: Default approval policy --> · **默认沙箱模式** <!-- en: Default sandbox mode -->。

添加以网页绘制的 Surface 的插件，即使是自行安装的，也会与 HTML 一样，将自身设置页面中的缩放 · 配色方案 · 允许远程内容 · 在沙箱中运行脚本的值应用于该 Surface。未更改的值使用插件设定的默认值；支持缩放快捷键的 Surface 中，快捷键会更改该插件的缩放值。

插件窗口中的 **配置** <!-- en: Configure --> 按钮也会跳转到这些页面。

浅色主题中的受信任提示框使用深绿色显示正文和盾牌图标。这表示签名判定，不代表经过代码审查或保证运行安全。

## 插件窗口

点击侧边栏最下方的 **插件** <!-- en: Plugins --> 按钮。窗口有三个标签页。

### 已安装的插件

**已安装** <!-- en: Installed --> 标签页。在左侧列表中选择插件，右侧会显示详情。通过列表上方的 **筛选已安装的插件…** <!-- en: Filter installed… --> 可以按名称筛选。

- 详情顶部名称下方的一行显示作者和插件 id。如有主页，会显示在同一行末尾。`http://` · `https://` 地址显示为带下划线的链接，点击后在浏览器中打开，其他值仅显示为文本。无法启动浏览器时，插件窗口会显示无法打开的通知。
- 列表行标有 **已禁用** <!-- en: Disabled --> 或 **运行中** <!-- en: Running -->。已启用但运行失败时，会显示红色标记及 **连接失败。请在设置中检查插件配置。** <!-- en: Failed to connect. Check the plugin's configuration in Settings. --> 提示。
- **权限** <!-- en: Permissions --> — 此插件已获得的权限列表。这里只能查看，无法更改。
- **命令** <!-- en: Commands --> — 插件添加的按键绑定命令。每行显示一条命令及其快捷键。在 macOS 上，会转换为实际按下的键，按 Ctrl · Option · Shift · Command 的顺序显示；Option · Shift · Command 遵循 **设置** > **常规** 中的修饰键显示方式（文字或符号）。在 **设置** > **按键绑定** > **插件** 中更改按键。
- **安装路径** <!-- en: Install path --> · **日志** <!-- en: Log --> — 详情的最后一节。长路径会换行完整显示，可以拖动选择并复制。标题行右侧的 **打开文件夹** <!-- en: Open folder --> 会在文件管理器中打开安装文件夹。无法启动文件管理器时，插件窗口会显示无法打开的通知。
- 详情下方的操作栏在滚动详情时始终可见。
  - 左侧开关 — 旁边的标签显示 **已启用** <!-- en: Enabled --> / **已禁用** <!-- en: Disabled -->。点击标签也可切换。关闭会清理进程，开启会重新启动。
  - **配置** <!-- en: Configure --> — 跳转到设置窗口中的插件页面。
  - **卸载** <!-- en: Uninstall --> — 点击后，操作栏会在原处变为确认提示，显示 **取消** <!-- en: Cancel --> 和 **卸载** <!-- en: Uninstall --> 按钮，点击卸载会删除安装文件夹。插件设置会保留，直到手动删除。**内置** <!-- en: built-in --> 插件会提示下次启动时不会重新安装。确认提示出现时，键盘焦点位于 **取消**，按 Enter 即可取消，按 Esc 也可取消（切换到其他标签页后按下也有效）。选择其他插件会取消确认，恢复普通操作栏。

### 需要关注

**待处理** <!-- en: Attention --> 标签页。注册被拒绝或运行失败的插件会在此集中显示，并附带原因。除下述 **非官方插件** <!-- en: Not an official plugin --> 条目外，详情顶部与已安装插件一样显示名称 · 作者 · id 及主页链接（地址为 `http://` · `https://` 时），下方显示描述。签名无效的插件因清单内容不可信，不显示描述和主页，描述位置显示 **签名无效，已隐藏描述。** <!-- en: Description hidden — the signature is invalid. -->。

| 显示 | 含义 | 操作 |
|------|----|------|
| **签名不受信任** <!-- en: Signature not trusted --> | 使用不在信任列表中的密钥签名 | 详情显示 **未经验证的插件** <!-- en: Unverified plugin --> 警告。确认来源后，使用 Signature 一节中的 **复制指纹** <!-- en: Copy fingerprint --> 按钮复制指纹并核对。可信时点击 **仍然注册** <!-- en: Register anyway --> |
| **签名无效** <!-- en: Signature invalid --> | 无签名或验证失败。详情用一行显示失败原因（如缺少签名文件） | 从分发者处获取正确的软件包更安全。如信任来源，可通过 **仍然注册** <!-- en: Register anyway --> 使用 |
| **权限已更改** <!-- en: Permissions changed --> | 更新改变了所需权限 | 查看 **新增请求** <!-- en: newly requested --> 列表并 **重新批准** <!-- en: Re-approve --> |
| **运行时错误** <!-- en: Runtime error --> | 已启用但运行期间失败 | 查看 **日志** |
| **非官方插件** | id 使用了官方 Tasty 插件专用的 `com.tasty.` 前缀，但并非官方插件，因此无法注册。只能移除 | 在 **插件 › 待处理** 中选择文件夹并 **移除** <!-- en: Remove --> |

**非官方插件** 条目是直接位于插件文件夹（`~/.tasty/plugins/`）下、清单可读取、id 以 `com.tasty.` 开头但不在官方列表中的文件夹。无法读取清单的文件夹不会显示为此类条目。它们未注册，因此不会运行，也不会出现在 `tasty plugin list` 中，Tasty 不会自动删除。文件夹名称可以与 id 不同；同一 id 有多个文件夹时，会各显示为一行，可分别选择。每行均计入标签页徽标和侧边栏徽标的数量。

此类条目的详情仅显示文件夹名称和 id，不显示清单中的显示名称 · 作者 · 描述 · 主页 · 版本，因为非官方清单可能将自身伪装成 Tasty。描述位置显示 **非官方插件，已隐藏描述。** <!-- en: Description hidden — it is not an official plugin. -->，**文件夹** <!-- en: Folder --> 一节显示路径，底部操作栏显示 **未注册** <!-- en: Not registered -->。唯一可用操作是 **移除**，没有 **仍然注册** · **重新批准** · **配置** · **打开文件夹**。

- 在 **插件 › 待处理** 中选择要删除的文件夹行，点击 **移除**。仅选择行不会将键盘焦点移至移除按钮。底部操作栏会在原处变为 **移除 {}？** 确认提示，并显示 **将从插件文件夹中删除此插件的文件夹。** 说明。焦点位于 **取消**，因此 Enter 会取消。Esc · **取消** · 选择其他行也会取消确认。
- 点击确认提示中的 **移除**，仅删除所选文件夹，同一 id 的其他文件夹会保留。进行期间显示 **正在移除…** <!-- en: Removing… -->，两个按钮均被禁用，Esc 和行点击会被忽略。删除前会再次检查，因此若期间清单的 id 已改为允许的 id，或清单变得无法读取，则会失败，不执行删除。
- 成功后，该行消失，两个徽标的数量减少，并显示 **已移除“{}”。** 短暂提示。在 Tasty 外已删除的文件夹也视为成功。失败时显示 **移除失败：{}** 短暂提示，操作栏恢复普通状态，该行保留，可重试。原因是文件操作的原始错误，因此即使在中文以外的韩文界面中也可能显示英文。
- 链接形式的文件夹会移除失败，目标和链接均不受影响。要清除此行，需手动删除链接。若删除中途失败，清单已被删除，只要该行仍在就可重试。下次扫描后，可能出现文件残留但没有对应行的情况，此时需手动删除剩余文件夹。

新发现此类文件夹时，每个文件夹都会在通知列表中留下一条警告。正文说明 `com.tasty.` 前缀为官方 Tasty 插件专用，并提示在 **插件 › 待处理** 中移除。若同一文件夹仍在，重启 Tasty 时会再次留下警告。

### 添加插件

**添加插件** <!-- en: Add plugin --> 标签页。

以 `com.tasty.` 开头的 id 为 Tasty 官方插件专用。不在 Tasty 官方列表中的 `com.tasty.*` id，在所有构建中都会于签名验证前被拒绝，也无法通过 **仍然添加** <!-- en: Add anyway --> 或 `--allow-unverified` 安装。此检查仅检查 id，官方列表中的 id 仍需经过签名验证。将官方列表外的 `com.tasty.*` id 对应文件夹直接放入插件文件夹下时，若清单可读取，则不会注册，而会显示在 **待处理** 标签页中，可在那里移除。

1. 在 **插件文件夹** <!-- en: Plugin folder --> 输入框中输入包含 `tasty-plugin.toml` 的文件夹，或通过 **查找文件夹…** <!-- en: Find folder… --> 选择。在 Tasty 文件夹选择器中，可以选择子文件夹，也可以不选择任何行，直接确认当前文件夹。双击进入文件夹，Enter 确认。取消后输入保持不变。
2. 通过查找文件夹确认后会立即验证。若直接输入路径，点击 **验证** <!-- en: Verify -->。输入框正下方会显示清单卡片，包含名称 · 版本 · id · 作者 · 描述 · **所需权限** · Surface 种类 · 源路径。主页为 `http://` · `https://` 地址时，可点击带下划线的链接在浏览器中打开（无法启动浏览器时，会显示无法打开的通知），其他值仅显示为文本。有多位作者时，第一位作者后显示 `+N`，悬停可查看完整列表。修改路径会清除卡片，需再次点击 **验证**。若文件夹中没有 `tasty-plugin.toml`，或格式错误而无法读取，会以 **无法读取 tasty-plugin.toml** <!-- en: Can't read tasty-plugin.toml --> 提示框代替卡片，下方一行显示读取错误原文。若文件可读取但内容不符合规则（例如指定的可执行文件不在文件夹中），同一位置会显示 **tasty-plugin.toml 无效** <!-- en: tasty-plugin.toml is not valid --> 提示框，下方一行显示错误内容。不在官方列表中的 `com.tasty.*` id 也会通过此提示框说明拒绝原因。下方一行显示英文原文 `plugin id '<id>' uses the reserved com.tasty. prefix but is not an official Tasty plugin`，不显示预览和添加按钮。修改路径后再次点击 **验证**。
3. 卡片下方的提示框显示签名判定：**由受信任的发布者签名** <!-- en: Signed by a trusted publisher -->、**权限已更改** <!-- en: Permissions changed --> 或 **未经验证的插件** <!-- en: Unverified plugin -->。未经验证的插件会显示原因（密钥不在信任列表中、缺少公钥文件、无签名、签名验证失败），并警告插件以当前账户权限运行，权限列表仅限制其可向 Tasty 请求的范围。判定涉及密钥时，提示框会显示指纹（fingerprint），可通过复制按钮复制。长指纹仅显示首尾各 8 字节，中间以 `…` 缩略；悬停或复制可获取完整值。
4. 下方一行左侧显示将授予的权限数量。点击 **添加插件** <!-- en: Add plugin -->。若权限已更改，同一位置的按钮变为 **信任并添加** <!-- en: Trust & add -->，点击后会将新的权限集记录到信任列表。权限仅限制插件可向 Tasty 请求的范围，不会将插件程序与当前账户的文件、网络、其他程序隔离。未经验证的插件对应按钮会变为 **仍然添加** <!-- en: Add anyway -->（密钥不在信任列表中时为 **信任密钥并仍然添加** <!-- en: Trust key & add anyway -->），初始焦点位于 **取消** <!-- en: Cancel -->，因此 Enter、Esc 会返回而不安装。仅在信任来源时点击。此选择会保留到清单更改或插件被卸载，安装后除列表中的标记外，没有其他限制。添加期间，按钮变为 **正在添加…** <!-- en: Adding… -->。
5. 若插件已安装，按钮会保持禁用，左侧显示 **已安装** <!-- en: Already installed -->。

安装会授予插件请求的权限。添加前请在预览中查看权限列表。

## 权限

插件会预先声明所需权限。向 Tasty 发送请求时，若缺少所需权限，该请求会被拒绝。

权限规定插件可向 Tasty 请求的功能范围，并不表示隔离插件进程的所有文件、网络访问。请查看待安装插件的来源和描述。

常见名称及含义：

| 权限 | 允许的操作 |
|------|-------------|
| `surface.read` · `surface.write` | 读取 Surface 列表 · 状态，创建 · 更改 Surface |
| `fs.read` · `fs.write` | 读取 · 写入文件 |
| `clipboard.read` · `clipboard.write` | 读取 · 写入剪贴板 |
| `terminal.spawn` · `terminal.write` · `terminal.read` | 创建终端、发送按键输入、读取输出 |
| `notification` | 显示通知 |
| `process.spawn` · `network` | 运行外部进程、网络 |
| `ui.tool_item` · `ui.popup` · `ui.settings_page` | 添加工具菜单项、弹窗、设置页面 |
| `file_handler.define` · `file_handler.handle:<种类>` | 定义文件种类识别规则，负责打开该种类的文件 |
| `memory.read` · `memory.write` · `memory.secret` | 访问智能体记忆存储 |
| `agent` · `approval` · `telemetry` | 智能体协作 · 批准条件 · 遥测 |
| `agent.turn_report` | 仅报告智能体任务回合的开始和结束（不开放其他智能体协作功能） |
| `completion_strategy.define` | 定义任务运行器判定子智能体完成的方式 |
| `ipc.invoke:<prefix>` | 调用其他插件以 `<prefix>` 名称提供的命令（例如 `ipc.invoke:codex` 为 Codex 插件命令） |

内置插件获得的权限：

| 插件 | 权限 |
|---------|------|
| Markdown 查看器 | `surface.read` `surface.write` `fs.read` `file_handler.define` `file_handler.handle:markdown` `ui.settings_page` `ui.popup` |
| 图像 | `surface.read` `surface.write` `clipboard.read` `fs.read` `fs.write` `file_handler.define` `file_handler.handle:image` |
| HTML 查看器 | `surface.read` `surface.write` `file_handler.define` `file_handler.handle:html` `file_handler.handle:svg` `ui.settings_page` |
| 剪贴板查看器 | `clipboard.read` `ui.popup` `ui.tool_item` |
| Git 查看器 | `ui.popup` `ui.tool_item` `fs.read` |
| Claude Code | `surface.read` `surface.write` `terminal.spawn` `terminal.write` `terminal.read` `fs.read` `fs.write` `notification` `telemetry` `agent` `agent.turn_report` `ui.settings_page` `completion_strategy.define` `memory.read` `ipc.invoke:codex` |
| Codex | `surface.read` `surface.write` `terminal.spawn` `terminal.write` `terminal.read` `fs.write` `notification` `ui.settings_page` `completion_strategy.define` `agent.turn_report` |

单独撤销或恢复权限只能通过 CLI 操作（见下文）。

## `tasty plugin` 命令

在 Tasty 运行期间于终端中使用。输出为 JSON。

不在官方列表中的 `com.tasty.*` id，即使指定 `--allow-unverified` 也无法安装。此拒绝发生在签名验证之前，不会在插件文件夹、权限或信任列表中留下任何内容。

| 命令 | 功能 |
|------|---------|
| `tasty plugin list` | 已安装插件的 id · 版本 · 启用 · 运行状态、是否被自动禁用及上次启动失败信息 |
| `tasty plugin show <id>` | 完整的清单 · 权限 · 命令 · 运行状态 |
| `tasty plugin install <文件夹> [--allow-unverified]` | 从包含 `tasty-plugin.toml` 的文件夹安装。按原样授予清单权限。未经验证的插件仅在指定 `--allow-unverified` 时安装 |
| `tasty plugin remove <id>` | 卸载已安装插件。对于 **非官方插件** 文件夹，不会删除，而是以提示前往 **待处理** 标签页的错误结束 |
| `tasty plugin enable <id> [--no-wait]` · `disable <id>` | 启用 · 禁用。`enable` 会等待插件连接（最多 15 秒），无法启动时会附带原因以失败结束。若 3 秒后仍在启动，会显示一次进行中提示 |
| `tasty plugin logs <id> [--follow]` | 输出日志。`--follow` 持续显示新行（用 `Ctrl+C` 中断） |
| `tasty plugin permissions <id>` | 清单要求的权限及实际授予的权限 |
| `tasty plugin grant <id> <权限>` · `revoke <id> <权限>` | 授予 · 撤销单项权限。只能授予清单中声明的权限 |
| `tasty plugin doctor <id>` | 诊断清单：是否存在此版本 Tasty 无法理解的规则 |
| `tasty plugin upgrade-builtins [--force] [--restore-removed <id>] [--restore-removed-all] [--restart-running]` | 将内置插件重新调整为捆绑版本。`--restore-removed` 恢复已卸载的内置插件（可多次指定），`--restore-removed-all` 恢复所有已卸载的内置插件。`--restart-running` 重启可执行文件已更改的插件（该插件的 Surface 会短暂关闭） |
| `tasty plugin extension list` | 插件为其他插件添加的扩展（extension）及状态 |
| `tasty plugin grant-agent-permission --agent <id> --permission <权限> [--ttl <秒>]` · `revoke-agent-permission` | 向运行中的智能体会话授予临时权限或撤销权限。省略 `--ttl` 时，持续到撤销为止 |
| `tasty plugin list-agent-permissions [--agent <id>]` | 智能体会话的基本权限和临时权限 |
| `tasty plugin request-permission --agent <id> --permission <权限> [--reason <原因>]` | 提前显示询问是否向智能体授予权限的批准弹窗。智能体自行执行时，只能以自身为目标，且此弹窗只能由用户批准或拒绝 |
| `tasty plugin audit-query` · `audit-summary` · `audit-follow` · `audit-clear` | 查询 · 汇总 · 实时查看 · 删除 Tasty 收到的请求（CLI · 插件 · 智能体）的允许、拒绝记录 |

对于通过 id 检查的插件，`install` 会在复制文件夹前验证签名。若插件未经验证，会警告原因和风险，不执行安装，并显示信任来源时可使用的 `tasty plugin install --allow-unverified <文件夹>` 命令。签名验证拒绝安装时，会报告实际原因（无签名、密钥不受信任、公钥文件缺失或不匹配等），不会在插件文件夹、权限或信任列表中留下任何内容。修复问题后可使用同一命令重新安装。若注册已完成但插件无法运行，已安装的文件夹会保留。此时通过 `tasty plugin logs <id>` 查看原因。

插件无法启动时，通知列表会留下一条警告。若短时间内多次失败，Tasty 自动禁用插件时会另留一条错误通知，在重新启用前不会启动。未手动重新启用时，同一插件后续的失败会合并为一条。每次手动启用的结果都会单独留下通知。可在通知正文和 `tasty plugin logs <id>` 中查看原因。

使用 **非官方插件** 文件夹的 id 执行 `tasty plugin remove <id>` 时，不会删除文件夹，而是以下列错误结束。`enable` 和 `disable` 也会显示同样的提示并失败。

`plugin '<id>' was not registered because its id uses the reserved com.tasty. prefix; remove its folder from Plugins > Attention`

同一 id 可能对应多个文件夹，因此仅凭 id 无法确定要删除的文件夹。在 **插件 › 待处理** 中选择文件夹并移除。

`enable` 和 `disable` 仅接受已安装插件的 ID。对于未安装且不存在上述文件夹的 id，错误原因会显示 `plugin '<id>' not installed`，设置不会更改。通过 `tasty plugin list` 查看已安装的 ID。

`disable` 会开始关闭处理，通常在后台进行。正常退出宽限期为 2 秒，之后若进程仍在，会尝试强制终止。这 2 秒并非整个命令的时间上限，在操作系统确认进程退出期间可能等待更久。期间执行 `enable`，会等待旧进程退出后再启动新进程。随后，`tasty plugin enable` 会等待新插件连接（最多 15 秒）并报告结果。若要立即返回，指定 `--no-wait`。此时以及智能体通过 IPC 直接请求时，只会收到启动请求已受理的响应，因此需通过 `tasty plugin show <id>` 查看结果。运行或连接失败时，查看通知和日志。

插件无响应、关闭其 Surface 耗时期间，其他命令和输入仍会正常处理。等待关闭时，若对该插件执行 `disable`，则进程一退出，关闭就会成功结束。期间退出 Tasty 时，退出会等待该关闭操作结束（最多 5 秒）。

```sh
tasty plugin list
tasty plugin permissions com.tasty.git-viewer
tasty plugin disable com.tasty.clipboard-viewer
tasty plugin logs com.tasty.markdown --follow
```

`tasty plugin permissions com.tasty.git-viewer` 的输出示例：

```json
{
  "granted": ["ui.tool_item", "fs.read", "ui.popup"],
  "id": "com.tasty.git-viewer",
  "manifest": ["ui.popup", "ui.tool_item", "fs.read"]
}
```

## 故障排除

| 症状 | 检查项 |
|------|-----------|
| Markdown · 图像 · HTML 文件无法在终端内打开 | 插件窗口中对应插件是否 **已启用**。禁用时，该 Surface 种类本身就不存在 |
| 工具菜单中没有 **剪贴板查看器** · **Git** | 两个插件已禁用或位于 **待处理** 中 |
| 插件状态为红色 | **日志** 按钮或 `tasty plugin logs <id>` |
| 想恢复已卸载的内置插件 | `tasty plugin upgrade-builtins --restore-removed <id>` |
| 更新后插件进入 **待处理** | 若显示 **权限已更改**，说明所需权限发生了变化。阅读列表并 **重新批准** |
| 出现 **未注册插件 '&lt;id&gt;'** 通知，或 **待处理** 标签页出现 **非官方插件** 条目 | 文件夹使用官方插件专用前缀，但不在官方列表中。未注册，因此不会运行。在 **插件 › 待处理** 中选择文件夹并 **移除** |

<a id="接下来阅读"></a>

## 相关阅读

- [文件管理与查看](../using/files.md) — Markdown · 图像 · HTML Surface 用法。
- [与 Claude、Codex 配合使用](../agents/claude-codex.md) — Claude Code · Codex 插件。
- [设置](../customize/settings.md) — 插件设置页面的位置。

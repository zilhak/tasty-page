<!-- source-hash: 8d264fb31f63 -->
# 设置

Tasty 的 Shell、字体、语言等可在设置窗口中更改，也可直接编辑 `~/.tasty/config.toml` 进行配置。按键绑定和主题在各自的指南中详细说明。

## 按用途查找

- [Shell 与输入](#终端)
- [显示与字体](#外观)
- [按键组合](keybindings.md)
- [主题](themes.md)
- [插件](../plugins/index.md)
- [自动化](scripts.md)

## 打开设置窗口

点击侧边栏最底部的 **设置** <!-- en: Settings --> 按钮，或按 `Ctrl+,`。
再次按相同快捷键即可关闭设置窗口。 <!-- en: Press the same shortcut again to close the settings window. -->

<!-- tasty-diagram: settings-window -->
```
┌─────────────────────────────────────────────────────────────┐
│ [常规] [终端] [外观] [按键绑定] [处理器] [其他] [插件]        │  顶部标签页
├──────────────┬──────────────────────────────────────────────┤
│ 筛选分区…    │                                              │
│ ▸ 常规       │   所选分区的设置项                           │
│   通知       │                                              │
│   辅助功能   │                                              │
├──────────────┴──────────────────────────────────────────────┤
│                                        [ 取消 ]  [ 保存 ]   │
└─────────────────────────────────────────────────────────────┘
```

- 顶部有 7 个标签页：**常规** <!-- en: General --> · **终端** <!-- en: Terminal --> · **外观** <!-- en: Appearance --> · **按键绑定** <!-- en: Keybindings --> · **处理器** <!-- en: Handler --> · **其他** <!-- en: Misc --> · **插件** <!-- en: Plugins -->。
- 左侧列表显示该标签页的分区。在上方的 **筛选分区…** <!-- en: Filter sections… --> 中输入文字即可筛选列表。切换标签页会清除搜索词。
- 点击 **保存** <!-- en: Save --> 后，会将更改的设置应用到界面并开始保存文件。写入文件期间可继续工作。点击 **取消** <!-- en: Cancel --> 会丢弃编辑内容。标题区域没有关闭按钮。
- 设置窗口打开期间，智能体通过命令更改的设置（输入规则、远程传输、允许外部 Webhook 等）在点击 **保存** 后仍会保留。保存只覆盖在此窗口中更改的项。如果两边更改了同一项，则保留此窗口中的值。
- 无法应用已保存的设置时，会显示错误通知，设置保持原样。如果已应用到界面，但无法写入 `config.toml`，则显示警告通知。此时更改的设置会在重启 Tasty 后丢失。
- 如果其他程序在 Tasty 读取 `config.toml` 后更改了该文件，Tasty 会报告保存失败，不会覆盖文件。要读取外部更改的设置，请重启 Tasty。
- 首次启动时校正的设置与已确认的 Shell 路径会一同保存。等待保存结果期间，加载界面会持续更新。运行期间即使仍有保存操作在等待，新窗口也会使用本次运行中已应用的最新设置。
- **语言** <!-- en: Language --> 需要保存并重启 Tasty 后才会生效。性能设置从保存后新打开的终端开始生效，已打开的终端不会立即更改。
- 数值框通过 **输入** 更改，没有可通过拖动增减数值的框。输入期间不会自动校正数值，离开输入框或按 `Enter` 时才会调整到允许范围内——输入超出范围的值时，输入框边框会变为警告色，下方会用一行显示允许范围和实际将保存的值。
- 整数框会根据数值长度变宽，以显示完整数值，输入期间也会随每个字符变宽。单位显示在框后。部分设置项会原样显示配置文件中超出范围的值。但如果 `[remote_attach] heartbeat_timeout_secs` 超出 10~600 范围，读取时会恢复为默认值 30，并重新保存到配置文件，警告仅写入日志。
- 如果设置窗口缩得过窄，某项的输入控件无法放在名称旁边，则仅将该项的控件移到名称下方。重新加宽后会移回旁边。

## 各标签页的设置项

### 常规

| 分区 | 设置项 |
|------|------|
| **常规** | **启动时恢复布局** <!-- en: Restore layout on startup --> · **重启时恢复 Surface 内容** <!-- en: Restore surface content on restart -->（终端回滚缓冲区）· **工作区分类（文件夹）** <!-- en: Workspace categories (folders) --> · **切换到下一个/上一个工作区时跨分类** <!-- en: Next/prev workspace crosses categories --> · **文件浏览器：自动刷新文件详情** <!-- en: Explorer: refresh file details -->（默认关闭——开启后，打开的文件夹内文件的大小和修改时间变化也会在几秒内反映，但每次检查都会读取该文件夹的所有条目。[文件浏览器](../using/files.md)）· **关闭行为** <!-- en: Close behavior -->（询问 / 最小化到后台 / 退出）· **滚轮滚动距离** <!-- en: Wheel scroll distance -->（10~200 pt，默认 50）——滚轮滚动一格的距离，统一应用于窗口内所有位置 · **语言**（English / 한국어 / 日本語 + 已安装的[语言包](#添加语言语言包)）· **属性中的时间格式** <!-- en: Time format in Properties -->（精确到分 / 精确到秒 / 秒 + UTC 偏移量，默认精确到分——用于文件浏览器属性窗口中的修改时间、创建时间、目标修改时间，以本机时区为准。也会立即应用于已打开的属性窗口）· **接受其他计算机的 Webhook 调用** <!-- en: Accept webhook calls from other computers -->（默认关闭，从下次启动开始生效——[Webhook](../agents/hooks-notifications.md)） |
| **通知** <!-- en: Notifications --> | **启用通知** <!-- en: Notifications enabled --> · **声音** <!-- en: Sound --> · **通知合并间隔（ms）** <!-- en: Coalesce interval (ms) --> |
| **辅助功能** <!-- en: Accessibility --> | **减少动态效果** <!-- en: Reduced motion -->（关闭短暂提示和叠加层的淡入淡出、加载指示器旋转、模态框抖动）· **显示修饰键提示** <!-- en: Show modifier key hints --> |
| **叠加层** <!-- en: Overlay --> | **短暂提示显示时长** <!-- en: Toast duration -->（1~10 秒） |
| **远程传输** <!-- en: Remote transfer --> | **保存文件夹** <!-- en: Save folder -->（默认 `~/.tasty/transfers/`）· **最大容量** <!-- en: Maximum size -->（MiB）——从远程工作区接收的文件的保存位置 |
| **远程附加** <!-- en: Remote attach --> | **附加连接** <!-- en: Attach connections --> 下的 **断开前等待时长** <!-- en: Disconnect after -->——单位为秒，默认 30，范围 10~600。远程附加连接中对端无响应时，断开前等待的时间 · **重新连接尝试时长** <!-- en: Keep reconnecting for --> ——默认 300 秒，范围 0~3600 秒 |
| **显示** <!-- en: Display -->（仅 macOS） | **Cmd 键显示** · **Option 键显示** · **Shift 键显示**——选择以文本或符号显示快捷键 |
| **权限** <!-- en: Permissions -->（仅 macOS） | **完全磁盘访问权限** <!-- en: Full Disk Access --> · **屏幕录制** <!-- en: Screen recording --> 状态，**请求所有权限** <!-- en: Request all permissions -->（一次请求文件夹和屏幕录制权限），完全磁盘访问权限行的 **打开系统设置** <!-- en: Open System Settings --> |

关闭 **重启时恢复 Surface 内容** 后，从下次运行开始不再恢复之前的终端内容。已保存的旧内容也不会恢复，但标签页布局和工作目录仍会恢复。恢复已关闭的标签页（`Ctrl+Shift+T`）时，只要此设置处于关闭状态，也不会填入终端内容。

**远程传输** 的保存文件夹旁的 **浏览…** 会打开设置内的 Tasty 文件夹选择器。用 **选择文件夹** 确认所选子文件夹或当前文件夹后，只会更改输入框。点击设置中的 **保存** 才会应用。取消或按 Esc 会保留原文件夹值。

在 **设置** <!-- en: Settings --> › **常规** <!-- en: General --> › **远程附加** 中更改 **断开前等待时长**。按 Enter 或移至其他输入框确认输入时，超出范围的数值会调整：小于 10 秒调整为 10 秒，大于 600 秒调整为 600 秒。保存的值无需重启即可应用于新连接，已打开的连接保持原样。两端 Tasty 各自使用自己的值，因此对端可能先断开。不读取配置文件的 CLI 附加使用 30 秒。

**设置** <!-- en: Settings --> › **常规** <!-- en: General --> › **远程附加** <!-- en: Remote attach --> 中的 **重新连接尝试时长** <!-- en: Keep reconnecting for --> 控制已保存远程行的连接中断后自动重新连接的持续时间。默认 300 秒，范围 0~3600 秒，0 禁用自动重新连接。不适用于手动断开的连接。配置键为 `[remote_attach] reconnect_timeout_secs`。

### 终端

| 分区 | 设置项 |
|------|------|
| **常规** | **Shell** <!-- en: Shell --> · **启动命令** <!-- en: Startup command --> · **回滚缓冲区行数** <!-- en: Scrollback lines -->（默认 10000）· **关闭运行中进程前确认** <!-- en: Confirm close running process --> · **继承工作目录** <!-- en: Inherit working directory --> · **屏幕反色闪烁（DECSCNM）** <!-- en: Reverse-screen flash (DECSCNM) --> · **显示响铃通知** <!-- en: Show bell notification --> · **链接点击修饰键** <!-- en: Link click modifier -->（Ctrl / Alt / 禁用左键点击打开）· macOS：**将 Option 用作 Meta** <!-- en: Use Option as Meta --> |
| **输入** <!-- en: Input --> | 按终端应用设置的 **使用 Shift+Enter 发送换行符** <!-- en: Send a newline with Shift+Enter --> 规则——添加可执行文件名（例如 `claude`）并开启后，该应用接收输入期间，`Shift+Enter` 会发送换行符（LF）。关闭或没有规则时，按平台默认方式发送 |
| **鼠标捕获** <!-- en: Mouse Capture --> | **显示鼠标捕获提示** <!-- en: Show mouse-capture hint --> · **让 Tasty 处理这些程序中的点击** <!-- en: Let Tasty handle clicks in these programs --> · **不为这些程序显示捕获通知** <!-- en: Don't show the capture notice for these programs -->——进程名或 `ht*` 等模式 |
| **TUI** | **允许读取剪贴板（OSC 52）** <!-- en: Allow clipboard read (OSC 52) -->——默认关闭。开启后，终端内的程序可以读取剪贴板 |
| **性能** <!-- en: Performance --> | **定向 PTY 轮询** <!-- en: Targeted PTY polling --> · **回滚缓冲区磁盘交换** <!-- en: Scrollback disk swap -->（将超出回滚缓冲区行数的行移到磁盘）· **磁盘保留行数** <!-- en: Lines kept on disk -->（默认 10000，-1 表示无限制——独立于回滚缓冲区行数，超出后从最旧的行开始丢弃）。输入框后显示单位 **行** <!-- en: lines -->，值为 -1 时，单位会替换为 **无限制** <!-- en: no limit -->。输入超出范围的值时，框下会显示“请输入 -1 或 0 到 100000000 之间的数值。”。如标签页顶部说明所述，这三项设置均从保存后新打开的终端开始生效，已打开的终端不会立即更改 |

将 **链接点击修饰键** 设为 **禁用左键点击打开** <!-- en: Disable left-click opening --> 后，左键点击不会打开链接。仍可在不按修饰键的情况下将鼠标悬停在链接上使其显示，也可继续使用链接上的右键菜单。弹窗或横幅可能阻止链接显示。鼠标捕获设置项的含义见[使用终端](../using/terminal.md)。

### 外观

| 分区 | 设置项 |
|------|------|
| **主题** <!-- en: Theme --> | 主题卡片列表——[主题](themes.md) |
| **颜色** <!-- en: Colors --> | 按项覆盖当前主题的颜色——[主题](themes.md) |
| **常规** | **默认字体设置** <!-- en: Default Font Settings -->：**字体族** <!-- en: Font family --> · **自定义字体文件** <!-- en: Custom font file --> · **字号** <!-- en: Font size -->（默认 14）· **行高** <!-- en: Line height --> · **字体 DPI 缩放** <!-- en: Font DPI scaling -->（自动 / 固定）。以及 **连字（Ligatures）** <!-- en: Ligatures --> · **背景不透明度** <!-- en: Background opacity --> |
| **显示** <!-- en: Display --> | **界面缩放** <!-- en: UI Scale -->——小 / 中 / 大 |
| **Tasty** | 按钮、侧边栏、标签页的颜色——**强调色** <!-- en: Accent --> · **侧边栏背景** <!-- en: Sidebar background --> · **活动标签页指示器** <!-- en: Active tab indicator -->（下划线 / 填充 / 圆点） |
| **终端** | 终端 Surface 的 **获焦点时的背景** <!-- en: Focused background --> · **未获焦点时的背景** <!-- en: Unfocused background --> 和单独的字体设置 |
| **文件浏览器** <!-- en: Explorer --> | 文件浏览器专用的单独字体设置 |
| **Markdown** · **HTML** | 插件添加的页面——Markdown 单独字体设置和 **允许远程内容** <!-- en: Allow remote content -->，HTML 查看器的 **默认缩放** <!-- en: Default zoom --> · **配色方案** <!-- en: Color scheme --> · **允许远程内容** · **在沙箱中运行脚本** <!-- en: Sandbox scripts --> |

字体设置中，**常规** 的默认值统一应用于终端、Markdown、文件浏览器；在各分区关闭 **使用默认值** <!-- en: Use default --> 后，仅该种类使用不同的值。**字体 DPI 缩放** 为 **自动** 时，不同显示器上的文字物理尺寸相同；为 **固定** 时，像素尺寸相同，因此高分辨率显示器上的文字会变小。

打开 **字体族** 列表后，可在顶部搜索框输入部分名称进行筛选，关闭列表会清除搜索词。**monospace（默认）** <!-- en: monospace (default) --> 项始终位于最顶部，不受搜索词影响，可随时返回默认字体。

**字体族** 或 **自定义字体文件** 的值无法使用时，会在对应输入框下方显示错误。本机未安装的字体名称也会显示为错误。输入框有焦点或字体列表打开时，以及正在检查输入值期间，会隐藏错误文字和红色标记。无法使用的值也可以 **保存**，值会原样保存，界面会使用其他字体显示。点击 **保存** 后，主窗口会立即为每个无法使用的值显示一条警告通知，通知正文中会显示对应的值。再次保存相同的值不会增加通知，在设置窗口中输入时也不会显示通知。有多个主窗口时，通知会显示在有焦点的主窗口中，显示时长遵循 **常规** 标签页中 **叠加层** 下的 **短暂提示显示时长** 设置。

### 按键绑定

见[按键绑定](keybindings.md)。

### 处理器

这些表用于设置打开文件时“识别文件种类”的规则和“用什么打开”。默认设置即可自动打开 Markdown、图片、HTML，通常无需修改。

- **文件扩展名映射** <!-- en: File Extension Mapping -->——多个检测器匹配同一扩展名时的优先级。
- **文件检测器** <!-- en: File Detectors -->——通过扩展名、路径模式识别文件种类的规则。列表按尝试检测器的顺序显示。可添加用户规则，使用已有检测器 id 添加时，会将自定义规则加入该检测器。删除仅移除自行添加的部分，内置和插件规则会保留。更改在保存时应用，此前可通过每行的撤销操作取消。
- **文件处理器** <!-- en: File Handlers -->——用哪种 Surface 打开已识别的种类，或是否交给操作系统默认应用。列表按执行顺序排列。priority 较低的优先；相同时，按用户、插件、内置的顺序执行。
- **钩子处理器** <!-- en: Hook Handlers -->——收到钩子或 Webhook 事件时执行的 Shell 命令和内部操作列表。[钩子、通知、Webhook](../agents/hooks-notifications.md)。

这些表保存在 `~/.tasty/file-handlers.toml` 和 `~/.tasty/hook-handlers.toml` 中，而非 `config.toml`。

### 其他

- **脚本** <!-- en: Scripts -->——注册通过按键绑定或事件执行的 Lua 脚本（[Lua 脚本](scripts.md)）。输入文件路径（例如 `~/.tasty/scripts/my-script.lua`）和显示名称，在 **按键绑定** > **运行脚本** 中分配按键绑定。注册后文件发生更改时，会显示 **已更改** <!-- en: changed --> 标记，并在下次运行时请求确认。
- **任务流水线** <!-- en: Task pipeline -->——任务图的 report 中保留的记录大小上限。超过 **单条记录大小上限** <!-- en: Note size limit --> 的记录会被截断，超过 **单次尝试报告上限** <!-- en: Attempt report limit --> 的记录不会保存，只统计数量。前一个值必须始终小于后一个值（[任务 report](../agents/tasks.md)）。
- **异常检测** <!-- en: Anomaly detection -->——更改内存增长、重复调用、调用激增的通知显示和阈值。这些是正常任务也可能触发的候选信号。重复调用统计的是同一调用的重复次数，而非响应延迟。关闭通知后仍会继续检测和记录，数值也可编辑。保存的值从下一次判定开始生效。超出范围的数值会在按 Enter 或移至其他输入框时校正，取消会丢弃编辑内容。

### 插件

这里汇集插件添加的设置页面。默认安装状态下有 **Claude Code** 和 **Codex** 页面——[插件](../plugins/index.md)。

## 添加语言（语言包）

Tasty 内置 English · 한국어 · 日本語 三种语言。其他语言可自行放入 **语言包**，
随后会一同显示在语言列表中。

### 创建语言包

在 `~/.tasty/lang/` 下创建 **以语言代码命名的文件夹**，并在其中放入 `pack.toml`。
例如法语为 `~/.tasty/lang/fr/pack.toml`。

```toml
[meta]
name = "Français"          # 语言列表中显示的名称（省略时使用文件夹名）

[font]                     # 必填——仅使用下面四项中的一项
builtin = true             # 所需字符均可使用 Tasty 默认字体显示
# file = "fonts/x.ttf"     # 随语言包放在文件夹内的字体文件
# family = "Noto Sans"     # 本机已安装的字体名称
# candidates = ["fonts/x.ttf", "Noto Sans"]   # 从上到下依次尝试

[button]                   # 从这里开始是要翻译的文本
ok = "OK"
cancel = "Annuler"
```

- **不能省略 `[font]`。** 只有文本而未指定字体时，文字可能显示为 □，
  因此语言包作者必须明确使用哪种字体。
- **声明的字体会应用于整个界面。** 通过 `file` · `family` · `candidates` 指定的
  字体会添加在默认字体之后，使设置、弹窗及插件界面（剪贴板查看器、
  Markdown 等）都能显示该语言的文字。`builtin = true` 表示“默认字体足够，
  无需添加”。
- **不必全部翻译。** 未填写的文本会显示为英语。将值设为空字符串
  （`""`）也视为“未翻译”，会显示英语——界面不会出现空白。
- 文本的键名（如 `[button] ok`）与 Tasty 内置语言文件的结构相同。
  复制已有语言文件作为起点更快。
- 含有 `{}` 的文本会在运行时填入对应值。**必须保持数量不变**
  ——删除会使对应值消失，增加则会在界面上原样显示 `{}`。

### 终端命令的帮助也会翻译

在终端中查看的帮助，如 `tasty --help`，也会使用所选语言。语言包中，
对应文本位于 `[cli.help]` 下。

```toml
[cli.help._root]
about = "Émulateur de terminal accéléré par GPU"

[cli.help._root.new]
about = "Créer une ressource"
```

- 这里也 **不必全部翻译。** 未填写的命令会保留英语说明，
  与已翻译的内容混合显示。
- 帮助中的用法、命令、选项标题，默认值说明和参数错误也会使用所选语言。
  `tasty help help` 和插件的 `help help` 也使用同一语言。插件参数即使没有说明，
  也会显示默认值说明。
  命令名称、选项、允许值保持不变。底层解析器提供的详细错误和服务器的
  原始错误文本可能仍为英语。
- 插件命令说明和参数帮助也可通过下述插件翻译文件更改。
  例如，要更改韩语 Codex 帮助标题，在 `~/.tasty/lang/plugins/com.tasty.codex/ko.toml` 中
  添加 `[codex.cli]` 和 `desc = "我的 Codex 命令"`。没有翻译键的旧版
  插件会保留原有说明。

### 选择

语言包会显示在设置窗口 › **常规** › **语言** 列表中。选择并点击 **保存** 后，重启 Tasty
即可应用。

### 修改插件文本

无需更改插件安装文件夹，即可覆盖文本。以韩语为例，
在 `~/.tasty/lang/plugins/com.tasty.clipboard-viewer/ko.toml` 中写入以下内容。

```toml
[clipboard_viewer.command]
open_viewer = "내 클립보드 열기"

[clipboard_viewer.popup]
title = "내 클립보드"
```

插件的工具项和内部界面读取同一文件。文件夹名称为插件 ID，
要更改其他插件，请使用对应插件的 ID 和翻译项名称。对于新语言包
`fr`，文件位于 `~/.tasty/lang/fr/plugins/com.tasty.clipboard-viewer.toml`。
必须先创建 `fr/pack.toml` 并选择该语言。

按安装版英语 → 安装版所选语言 → 用户文件的顺序覆盖。空值或缺失项会
保留前一阶段的文本。TOML 格式错误或超过 2 MiB 的文件会被忽略，并留下警告。
修改后请重启 Tasty。插件升级后，此文件仍会保留。
不要在主程序的 `ko.toml` 或 `pack.toml` 中重复添加相同的插件条目。

即使启动时将 `TASTY_HOME` 指定为相对路径，插件也会以启动 Tasty 的目录为基准读取用户翻译。
默认捆绑的插件也从此主目录启动，用户翻译中缺失的文本会使用安装版翻译。

### 仅修改内置语言的文本时

放入 **单个文件** 而非文件夹——例如 `~/.tasty/lang/ko.toml`。仅覆盖写入的文本，
也不需要 `[font]`。此方式仅用于 English · 한국어 · 日本語 三种语言。
以此方式放入新语言时，不会显示在列表中。

与语言包相同，将值设为空字符串（`""`）也视为“不更改”——会保留该语言
原有的文本，界面不会出现空白。

### 无法正常工作时

- **未显示在列表中**——检查文件夹名是否为语言代码，其中的文件名是否准确为
  `pack.toml`，以及是否包含 `[font]`。关闭设置窗口后重新打开
  （列表仅在窗口打开时读取一次）。`pack.toml` **不能超过 2 MiB**——内置
  语言文件不足 400 KiB，正常翻译不会触及此限制。
- **显示英语并出现警告**——表示找不到所选语言的语言包，或文件有误。
  警告会显示查找的路径。**设置会保留**，因此修复语言包
  并重启后即可恢复为该语言。
- **文字显示为 □ 并出现字体警告**——表示语言包和文本已加载，但找不到或无法打开
  `[font]` 指定的字体。文本仍会显示，只是未添加字体。
  检查 `file` 路径（相对于语言包文件夹）或 `family` 名称，然后重启。
- 详细原因会以一行写入 `~/.tasty/debug.log`。

## 配置文件 `~/.tasty/config.toml`

常规设置保存在此文件中。处理器表和主题文件等使用上文说明的独立路径。缺失的键会读取默认值，因此只需填写需要的项。

`[remote_attach]` 的 `heartbeat_timeout_secs` 是远程附加连接在对端无响应时等待的时间。单位为秒，默认值为 30，范围为 10~600。文件中的任一值超出范围时，会将整个 `[remote_attach]` 恢复为默认值（`heartbeat_timeout_secs = 30`、`reconnect_timeout_secs = 300`），重新写入配置文件，警告仅写入日志。直接编辑配置文件的内容会在下次启动 Tasty 时读取。要在不重启的情况下应用于新连接，请在设置窗口中更改并保存。

`[remote_attach]` 中的 `reconnect_timeout_secs` 为已保存远程行的自动重新连接尝试时长，单位为秒，默认 300，范围 0~3600。0 禁用自动重新连接，不重试手动断开的连接。文件中的任一值超出范围时，会将整个 `[remote_attach]` 恢复为默认值（`heartbeat_timeout_secs = 30`、`reconnect_timeout_secs = 300`），重新写入配置文件，警告仅写入日志。

配置文件中的字体值（如 `[appearance.default_font]` 中的 `font_family`）无法使用时，启动 Tasty 后，主窗口会为每个值显示一条警告通知。通知正文中会显示对应的值，界面会使用其他字体显示。显示通知的窗口和显示时长遵循上方外观部分的说明。智能体通过命令应用的字体值即使无法使用，也只写入日志，不会显示警告通知。

```toml
[general]
language = "ko"                  # "en" | "ko" | "ja"
close_behavior = "ask"           # "ask" | "minimize" | "quit"
wheel_line_scroll = 50.0         # 滚轮滚动一格的距离(pt), 10~200
restore_layout = true
restore_surface_content = true
scrollback_lines = 10000
inherit_cwd = true
confirm_close_running = true
link_click_modifier = "ctrl"     # "ctrl" | "alt" | "none"
click_to_move_cursor = true      # 点击 Shell 输入行时将光标移到该位置
allow_clipboard_read = false
bell_notification = true
workspace_categories_enabled = false
explorer_refresh_file_details = false  # 文件浏览器也自动反映打开的文件夹内文件的大小和修改时间变化
explorer_props_time_format = "minutes"  # "minutes" | "seconds" | "seconds_offset" — 属性窗口中的时间格式
mouse_capture_blacklist = ["htop"]
shell = ""                       # 留空时自动检测
startup_command = ""

[appearance]
theme = "mocha"                  # ~/.tasty/themes/<id>.toml
ui_scale = "medium"              # "small" | "medium" | "large" — 侧边栏宽度也使用此值
ligatures = true
background_opacity = 1.0
active_tab_indicator = "underline"   # "underline" | "fill" | "dot"

[appearance.default_font]
font_family = ""
font_size = 14.0
line_height = 1.0
font_scale_mode = "auto"         # "auto" | "fixed"

[appearance.terminal_font]       # 留空时使用 default_font
font_size = 15.0

[notification]
enabled = true
sound = false
coalesce_ms = 500

[accessibility]
reduced_motion = false

[modifier_hint]
enabled = true

[overlay]
toast_duration_ms = 2000

[performance]
targeted_pty_polling = true
scrollback_disk_swap = false
scrollback_disk_lines = 10000     # 磁盘保留行数, -1 表示无限制

[remote_transfer]
dir = ""                         # 留空时使用 ~/.tasty/transfers/
max_mb = 500

[remote_attach]
reconnect_timeout_secs = 300     # 重新连接尝试时长（秒），0~3600，0 禁用自动重新连接
heartbeat_timeout_secs = 30      # 对端无响应时等待至断开的时间(秒), 10~600, 从新连接开始生效

[webhook]
allow_external = false           # true 时也接受其他计算机的 Webhook 调用(从下次启动开始)

[task_pipeline]
report_append_bytes = 1024       # 单条记录大小上限, 64~65536
report_block_bytes = 16384       # 单次尝试报告上限, 128~131072, 必须大于单条记录大小上限

[anomaly_detection]
rss_surge_notify = true
rss_surge_samples = 5            # 3~20
rss_surge_min_mib = 256          # 0~65536 MiB
slow_loop_notify = false
slow_loop_window_secs = 300      # 30~3600
slow_loop_threshold = 20         # 2~10000
call_burst_notify = true
call_burst_window_secs = 60      # 1~600
call_burst_threshold = 1000      # 10~100000

[keybindings]
new_tab = ["alt+t"]              # 其余见 keybindings.md
```

异常检测阈值在此文件中更改。关闭通知后仍会保留检测记录。SlowLoop 不测量响应时间，正常轮询也可能触发，因此默认只记录。RSS 增长信号要求最后一个样本达到最小大小。持续的 RSS 增长趋势和 SlowLoop 重复调用仅记录一次，重新开启通知也不会追溯通知之前的记录。运行期间更改阈值会保留观测状态。缩短查询时间段或减少样本数时，会在下次检查时裁剪历史；增加后也无法恢复已丢弃的历史。文件中超出范围的值会使整个分区恢复为默认值，运行期间的无效更改会被拒绝。

- `[terminal_input]` 保存各应用的 Shift+Enter 行为。请在 **终端 → 输入** 中设置。例如，在 `[[terminal_input.rules]]` 中指定 `app = "claude"` 和 `shift_enter_newline = true`，即可向 Claude Code 发送换行符。`initialized_defaults` 是插件默认值的应用记录，无需手动修改。
- `[appearance]` 下还保存完整的主题颜色（`theme_base`）和在颜色标签页中覆盖的值（`theme_overrides`）。使用设置窗口比手动修改更安全。
- 插件设置页面的值保存在以插件 id 为键的分区中，例如 `[plugin_settings."com.tasty.html"]`。
- Tasty 运行期间不会监视此文件。手动修改的值会在下次启动时读取。运行期间检测到外部更改时，会拒绝保存并保留文件。请在退出 Tasty 后直接编辑文件。

只有远程传输设置项也可通过 CLI 读写。

```sh
tasty settings get-remote-transfer
tasty settings set-remote-transfer --dir ~/incoming --max-mb 1000
```

更改设置的命令（`set-remote-transfer`、`set-input-rule`、`tasty webhook allow-external` 等）会先应用设置并保存到 `config.toml`，再输出结果。如果无法保存，会以错误结束，不会报告成功。此时该值仅在本次运行中生效。

## `~/.tasty` 文件夹中的内容

`~/.tasty/config.toml` 是配置文件。布局存储和插件数据单独管理。不要为排查布局恢复问题而直接编辑或删除存储文件。

| 路径 | 内容 |
|------|------|
| `config.toml` | 上述设置 |
| `themes/` | 主题文件——[主题](themes.md) |
| `lang/` | 语言包和语言覆盖文件——[添加语言](#添加语言语言包) |
| `plugins/` · `plugins-logs/` | 已安装的插件和日志——[插件](../plugins/index.md) |
| `file-handlers.toml` · `hook-handlers.toml` | 处理器标签页中的用户项 |
| `remote-profiles.toml` | 远程连接配置档——[继续远程工作](../remote/attach.md) |
| `scripts/` | 放置 Lua 脚本的惯例位置——[Lua 脚本](scripts.md) |
| `transfers/` | 远程接收文件的默认保存文件夹 |
| `tasty.port` · `debug.log` | 运行中实例的端口、警告及以上级别的日志——[故障排除](../help/troubleshooting.md) |

<a id="接下来阅读"></a>

## 相关阅读

- [按键绑定](keybindings.md)——默认表、预设、录制。
- [主题](themes.md)——切换主题、覆盖颜色、自行创建。
- [插件](../plugins/index.md)——插件设置页面和管理窗口。

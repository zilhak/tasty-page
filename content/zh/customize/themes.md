<!-- source-hash: 375b54e92369 -->
# 主题

Tasty 支持浅色 Latte 和深色 Mocha 主题，可修改部分颜色或通过 TOML 文件创建自定义主题。主题文件保存在 `~/.tasty/themes/`。

## 内置主题

| 主题 | 文件 | 明暗 | 备注 |
|------|------|------|------|
| **Catppuccin Mocha** | `~/.tasty/themes/mocha.toml` | 深色 | 默认主题。即使删除或损坏，下次启动时也会恢复为原始内容 |
| **Catppuccin Latte** | `~/.tasty/themes/latte.toml` | 浅色 | 主题文件夹为空时创建。如果还有其他主题，则不会重新创建已删除的 Latte |

这两个文件均由 Tasty 管理，因此**不要直接编辑**——启动时会将 Mocha 和仍然存在的 Latte 文件还原为原始内容。要修改颜色，请使用下方的“仅修改部分颜色”或“自行创建”。

如果因读取权限或文件编码问题无法读取原始内容，则不会覆盖文件。如果无法读取所选主题，则使用内置 Mocha 颜色。运行期间或在额外窗口中应用主题时，不会修复文件。修复文件后，重新打开设置中的主题列表或重启 Tasty。

浅色 Latte 主题提高了横幅正文和倒计时、按钮、按键标记和标签，以及选中行和键盘活动行中文字的对比度，使其更易辨认。

## 切换主题

最快的方法是使用状态栏最右侧的**主题图标**。每次点击都会在 Latte 和 Mocha 之间切换。使用其他主题时点击，会切换到 Latte。

要从列表中选择：

1. **设置** <!-- en: Settings -->（`Ctrl+,`）> **外观** <!-- en: Appearance --> > **主题** <!-- en: Theme -->。
2. 点击**主题预设** <!-- en: Theme Preset --> 下的一张卡片。卡片显示名称和五种代表色。
3. 点击**保存** <!-- en: Save -->。

切换主题会重置**颜色**标签页和 **Tasty** 标签页中覆盖的所有颜色，以及**终端**标签页中设置的获焦点时的背景、未获焦点时的背景。应用新主题后，将以该主题的颜色为基础。

如果设置中指定的主题文件不存在或无法读取，则使用 Mocha 启动，并显示**未找到主题** <!-- en: Theme not found --> 提示。

## 仅修改部分颜色

无需创建主题文件，即可覆盖当前主题的颜色。有三处可设置。

### 外观 > 颜色

**颜色** <!-- en: Colors --> 标签页按组列出当前主题的所有颜色——**背景** <!-- en: Surfaces --> · **叠加层** <!-- en: Overlays --> · **文本** <!-- en: Text --> · **强调色** <!-- en: Accents --> · **终端专用** <!-- en: Terminal-specific --> · **ANSI 16** <!-- en: ANSI 16 -->。

1. 取消勾选要修改行的**默认** <!-- en: Default -->。
2. 选择颜色或输入十六进制值。
3. 行内的**重置** <!-- en: Reset --> 仅还原该颜色，上方的**全部重置** <!-- en: Reset all --> 还原全部颜色。修改数量显示为**已修改 n 项** <!-- en: n changed -->。
4. **保存**。

### 外观 > Tasty

三个选项用于修改按钮、侧边栏和标签页的外观。

- **强调色** <!-- en: Accent -->——用于活动标记、焦点环、按钮等的颜色。
- **侧边栏背景** <!-- en: Sidebar background -->。
- **活动标签页指示器** <!-- en: Active tab indicator -->——选择**下划线** <!-- en: Underline --> / **填充** <!-- en: Fill --> / **圆点** <!-- en: Dot --> 之一。

通过**使用主题默认值** <!-- en: Use theme defaults --> 一次还原这三个选项。

### 外观 > 终端

分别设置终端 Surface 的**获焦点时的背景** <!-- en: Focused background --> 和**未获焦点时的背景** <!-- en: Unfocused background -->。关闭行内的**使用默认值** <!-- en: Use default --> 即可编辑。通过背景色区分获得焦点和未获得焦点的终端是 Tasty 的默认行为——Mocha 获得焦点时为 `#000000` / 未获得焦点时为 `#1e1e2e`。

这样覆盖的值保存在 `~/.tasty/config.toml` 的 `[appearance]` 下。

## 自行创建

一个 `~/.tasty/themes/<id>.toml` 文件对应一个主题。文件名（不含扩展名）成为主题 id，设置中的主题卡片显示 `label`。不会读取其他文件夹中的文件。

**所有颜色项均可选**。未填写的项会保留此前应用的主题值。因此，只有几行的文件也能构成主题。

```toml
# ~/.tasty/themes/my-theme.toml
label = "My Theme"      # 卡片上显示的名称
is_light = false        # 省略时保留上一主题的值

[palette]
crust    = "#11111b"    # 最深的背景
mantle   = "#181825"    # 侧边栏等
base     = "#1e1e2e"    # 默认背景
surface0 = "#313244"
surface1 = "#45475a"
surface2 = "#585b70"
overlay0 = "#6c7086"
overlay1 = "#7f849c"
overlay2 = "#9399b2"
text     = "#cdd6f4"
subtext1 = "#bac2de"
subtext0 = "#a6adc8"
placeholder = "#6c7086"

[accent]
blue = "#89b4fa"        # 默认强调色
green = "#a6e3a1"
red = "#f38ba8"
yellow = "#f9e2af"
peach = "#fab387"
mauve = "#cba6f7"
teal = "#94e2d5"
sky = "#89dceb"
lavender = "#b4befe"
flamingo = "#f2cdcd"
pink = "#f5c2e7"
maroon = "#eba0ac"
rosewater = "#f5e0dc"

[terminal]
selection_bg = "#585b70"
vi_cursor_bg = "#b4befe"
search_match_bg = "#f9e2af4d"          # 8 位 = 最后两位为透明度（与该单元格的背景混合）
search_match_active_bg = "#f9e2afb3"
search_match_active_fg = "#1e1e2e"     # 当前匹配结果内的文字颜色。省略时使用此值

[ansi]
black = "#45475a"
red = "#f38ba8"
green = "#a6e3a1"
yellow = "#f9e2af"
blue = "#89b4fa"
magenta = "#cba6f7"
cyan = "#94e2d5"
white = "#bac2de"
bright_black = "#6c7086"
bright_red = "#f38ba8"
bright_green = "#a6e3a1"
bright_yellow = "#f9e2af"
bright_blue = "#89b4fa"
bright_magenta = "#cba6f7"
bright_cyan = "#89dceb"
bright_white = "#cdd6f4"

[surfaces.terminal]
focused_bg   = "#000000"
focused_fg   = "#cdd6f4"
unfocused_bg = "#1e1e2e"
unfocused_fg = "#a6adc8"

[surfaces.markdown]
focused_bg   = "#11111b"
focused_fg   = "#cdd6f4"
```

规则：

- 颜色采用 `#RGB` · `#RRGGBB` · `#RRGGBBAA` 格式。若为 8 位，最后两位为透明度。
- `[surfaces.<种类>]` 设置各 Surface 种类获得焦点 / 未获得焦点时的背景色和文字颜色。除 `terminal` · `markdown` 外，也可使用插件注册的种类名称，未定义的种类使用安全的默认颜色绘制。Markdown 文档背景始终使用 `[surfaces.markdown]` 的 `focused_bg`，与是否获得焦点无关。
- 悬停、选中高亮等半透明效果根据 `is_light` 自动确定。间距和字号不在主题文件中设置。
- 创建浅色主题时，必须填写 `is_light = true`。叠加层颜色的方向（叠加黑色 / 叠加白色）由此值决定。

要应用创建的文件，请打开**设置** > **外观** > **主题**。每次打开此标签页都会重新读取文件夹，因此无需重启。卡片出现后，点击卡片并**保存**。

要创建仅对 Mocha 略作修改的变体，请复制 `mocha.toml`，以**其他名称**保存后再修改。如果修改 `mocha.toml` 本身，下次启动时会恢复为原始内容。

## 故障排除

| 现象 | 检查内容 |
|------|-----------|
| 卡片列表中没有自己的主题 | 文件是否确实位于 `~/.tasty/themes/`，扩展名是否为 `.toml`。关闭设置窗口后重新打开 |
| 启动后立即显示**未找到主题** | `config.toml` 中的 `theme = "…"` 指向的文件不存在或有语法错误。修复文件或在设置中选择其他主题 |
| 部分颜色仍是上一主题的颜色 | 属于正常现象——未填写的项会保留之前的值。在文件中明确填写这些项 |
| 在颜色标签页中修改的值消失了 | 切换主题会重置覆盖的值。将颜色转写到主题文件中 |

<a id="接下来阅读"></a>

## 相关阅读

- [设置](settings.md)——外观标签页中的字体、界面缩放、透明度。
- [初识界面](../getting-started/first-look.md)——状态栏中主题图标的位置。

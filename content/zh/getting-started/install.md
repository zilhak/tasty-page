<!-- source-hash: 5662d7916a3a -->
# 安装

Tasty 的 Windows、macOS 和 Linux 安装文件可在 GitHub 发布页面按架构下载。macOS 支持 Apple Silicon。

从 [GitHub 发布页面](https://github.com/zilhak/tasty/releases)下载安装文件。目前不提供安装脚本或通过包管理器（apt 仓库、Homebrew、winget 等）安装的方式。

## 选择安装文件

`{ver}` 表示版本号（例如 `0.10.3`）。

| OS | 架构 | 文件 | 说明 |
|----|---------|------|------|
| Linux | x86_64 | `tasty_{ver}-1_amd64.deb` | Debian / Ubuntu / Mint |
| Linux | x86_64 | `tasty-{ver}-1.x86_64.rpm` | Fedora / RHEL / openSUSE |
| Linux | x86_64 | `Tasty-{ver}-x86_64.AppImage` | 不依赖发行版的单文件 |
| Linux | x86_64 | `tasty-{ver}-linux-x64.tar.gz` | 用于手动安装的压缩包 |
| Linux | aarch64 | `_arm64.deb` / `.aarch64.rpm` / `-aarch64.AppImage` / `-linux-arm64.tar.gz` | ARM64 |
| Linux | x86_64 | `tasty-headless-{ver}-linux-x64.tar.gz` | [无界面构建](#无界面构建)（在服务器上运行，不打开窗口） |
| Linux | aarch64 | `tasty-headless-{ver}-linux-arm64.tar.gz` | [无界面构建](#无界面构建) |
| macOS | Apple Silicon | `Tasty-{ver}-macos-arm64.dmg` | 拖动安装。不提供 Intel Mac 构建 |
| macOS | Apple Silicon | `tasty-headless-{ver}-macos-arm64.tar.gz` | [无界面构建](#无界面构建) |
| Windows | x86_64 | `tasty-{ver}-windows-x64.msi` | 安装向导（推荐） |
| Windows | x86_64 | `tasty-{ver}-windows-x64.zip` | 解压即用的免安装版 |
| Windows | x86_64 | `tasty-headless-{ver}-windows-x64.zip` | [无界面构建](#无界面构建) |
| Windows | ARM64 | `tasty-{ver}-windows-arm64.msi` | 安装向导。0.12.2 及更早版本不提供。参见 [Windows](#windows) |
| Windows | ARM64 | `tasty-{ver}-windows-arm64.zip` | 解压即用的免安装版 |
| Windows | ARM64 | `tasty-headless-{ver}-windows-arm64.zip` | [无界面构建](#无界面构建) |

可使用各 OS 对应的 `SHA256SUMS-*.txt` 验证下载的文件。

网站首页的下载按钮仅在存在与浏览器报告的 OS 和架构匹配的文件时，才直接链接到该文件。无法识别架构时会链接到发布页面，请从上表中选择符合计算机架构的文件。

## Linux

```sh
# .deb (Debian / Ubuntu / Mint)
sudo apt install ./tasty_{ver}-1_amd64.deb

# .rpm (Fedora / RHEL / openSUSE)
sudo dnf install ./tasty-{ver}-1.x86_64.rpm

# .AppImage — 无需安装即可运行
chmod +x Tasty-{ver}-x86_64.AppImage && ./Tasty-{ver}-x86_64.AppImage
# 环境中没有 FUSE 时
./Tasty-{ver}-x86_64.AppImage --appimage-extract-and-run

# .tar.gz — 解压后直接运行
tar -xzf tasty-{ver}-linux-x64.tar.gz && ./tasty-linux-x64/tasty
```

- `.deb` / `.rpm` 会将 `tasty` 命令加入 PATH，并在应用菜单中添加图标。包管理器会一并安装所需的库。
- 存在 `libvulkan1` / `vulkan-loader` 时使用 GPU 加速（Vulkan）。没有这些库也能安装和运行，此时使用 OpenGL；如果 OpenGL 也不可用，则使用软件渲染。
- `zenity` 是推荐安装的包。无法将再次启动的请求传递给已运行的 Tasty 时，用它显示提示框。未安装时改用桌面通知。
- `.AppImage` 捆绑了运行所需的库。应用菜单项需自行注册（使用 `appimaged`，或将 `.desktop` 文件放入 `~/.local/share/applications/`）。
- `.tar.gz` 需要自行配置 PATH 和菜单项。缺少所需的系统库时，运行 `tasty` 会提示缺失的库并退出。
- 许可证声明（Tasty 的 MIT 全文、捆绑字体和 Markdown 渲染引擎的许可证全文、第三方声明文档）随构建产物一同提供。`.deb` 中的位置是 `/usr/share/doc/tasty/`，`.rpm` 和 `.AppImage` 中是 `usr/share/licenses/tasty/`，`.tar.gz` 中是解压后目录的顶层。
- 构建基准为 Ubuntu 24.04（glibc 2.39），因此在更旧的发行版（Ubuntu 20.04、Debian 11 等）上可能因 `GLIBC_2.39 not found` 错误而无法运行。不单独提供适用于旧发行版的构建。
- HTML 和 Markdown 查看器需要 WebKitGTK 2.40 或更高版本。构建基准 Ubuntu 24.04 的 `libwebkit2gtk-4.1` 满足此条件。

## macOS

1. 打开 `.dmg`，将 `Tasty.app` 拖入 `Applications` 文件夹。
2. 首次启动时如出现“无法验证开发者”警告，在**系统设置 > 隐私与安全性**中允许。

要从终端直接清除警告：

```sh
xattr -dr com.apple.quarantine /Applications/Tasty.app
```

首次启动后，可能会依次出现 macOS 权限提示（下载、文稿、桌面文件夹，以及屏幕录制）。是否显示取决于已有的批准状态和 macOS 策略。提示出现的原因及处理方式见[故障排除](../help/troubleshooting.md#macos-权限提示)。

## Windows

在 Windows ARM 设备上，下载名称中包含 `windows-arm64` 的文件。ARM64 文件从 0.12.2 之后的版本开始提供。

Windows ARM 也在支持范围内。

- **`.msi`（推荐）** — 双击并按安装向导操作。会注册开始菜单快捷方式和“应用和功能”中的卸载项。
- **`.zip`** — 解压到所需文件夹并运行 `tasty.exe`。

```powershell
Expand-Archive tasty-{ver}-windows-x64.zip -DestinationPath tasty
.\tasty\tasty.exe
```

首次启动时会出现“Windows 已保护你的电脑”警告（因为没有代码签名）。点击**更多信息 → 仍要运行**即可。

在 Windows 上，Tasty 使用 **Git Bash** 作为 Shell。未安装 Git for Windows 时首次启动，会显示**选择 Shell** <!-- en: Choose a shell --> 界面，而非终端。输入 bash.exe 路径并点击**使用此 Shell** <!-- en: Use this shell -->，即可使用该 Shell 启动；点击**退出** <!-- en: Quit --> 则关闭 Tasty。仅当路径指向有效的 bash 或 zsh 可执行文件时，才能点击**使用此 Shell**。启动后，如果配置的 Shell 路径无效，设置窗口的**终端** <!-- en: Terminal --> 标签页中会显示“找不到 Git Bash”提示。此时安装 Git for Windows，或在**设置** <!-- en: Settings --> > **终端** <!-- en: Terminal --> > **Shell** <!-- en: Shell --> 中手动指定 bash 路径。

## 首次启动

- 窗口打开后，已有一个工作区和一个终端。界面布局见[初识界面](first-look.md)。
- 界面语言默认为英语。要切换为韩语，在**设置** > **常规** <!-- en: General --> > **语言** <!-- en: Language --> 中选择韩语，保存后重新启动 Tasty。也可以直接写入 `~/.tasty/config.toml`：

```toml
[general]
language = "ko"
```

在终端中检查安装是否成功。第二条命令仅在 Tasty 运行时响应。

```sh
tasty --version      # 例如：tasty 0.10.3
tasty list info      # 正在运行的 Tasty 的版本、工作区数量
```

在 Tasty 内打开的 Shell 会自动将 `tasty` 命令加入 PATH。在 macOS 上，如需从其他终端应用或脚本中使用，将 `/Applications/Tasty.app/Contents/MacOS/tasty` 加入 PATH 或创建符号链接。Windows `.zip` 版同样需要将解压后的文件夹加入 PATH。

## GPU 要求

Tasty 使用 GPU（Vulkan / DirectX 12 / Metal）绘制界面。没有 GPU 时会再尝试使用软件渲染器；如果仍然失败，则退出，不打开窗口。此时屏幕上不显示错误，日志（`~/.tasty/debug.log`，从终端启动时还包括终端输出）中会记录“找不到 GPU 适配器”。安装或更新 GPU 驱动通常可以解决。名称中不含 `headless` 的安装文件均为 GUI 构建。如需在服务器上无图形界面运行，使用下面的无界面构建。

## 无界面构建

在服务器上运行 Tasty 且不打开窗口的**无界面构建**，以各 OS 对应的压缩包（名称以 `tasty-headless-` 开头）发布在发布页面上。解压即用，不以 `.deb`、`.rpm`、`.AppImage`、`.dmg`、`.msi` 等安装文件形式分发。GUI 构建和无界面构建的可执行文件都名为 `tasty`，因此应解压到与 GUI 版不同的文件夹。捆绑插件位于压缩包内的 `plugins/` 中。

```sh
# Linux（aarch64 将 x64 替换为 arm64）
tar -xzf tasty-headless-{ver}-linux-x64.tar.gz && ./tasty-headless-linux-x64/tasty

# macOS (Apple Silicon)
tar -xzf tasty-headless-{ver}-macos-arm64.tar.gz && ./tasty-headless-macos-arm64/tasty
```

```powershell
# Windows（ARM64 将 x64 替换为 arm64）
Expand-Archive tasty-headless-{ver}-windows-x64.zip -DestinationPath tasty-headless
.\tasty-headless\tasty.exe
```

在 macOS 上，通过浏览器下载的文件在运行时可能出现“无法验证开发者”警告。此时使用 `xattr -dr com.apple.quarantine tasty-headless-macos-arm64` 清除隔离标记。

无界面构建的 `tasty` 即使不带选项运行，也不会打开窗口，终端仅通过 `tasty` CLI 创建和操作。可以从其他计算机通过[远程附加](../remote/attach.md)查看该工作区。给 GUI 构建添加 `--headless` 运行时，仍会像平常一样以 GUI 启动，并不会在无窗口状态下运行。

对于没有发布文件的环境（例如 Intel Mac），在已安装 Rust 的环境中从源码自行构建。

```sh
git clone https://github.com/zilhak/tasty.git
cd tasty
cargo build --release --no-default-features
./target/release/tasty
```

## 更新

没有自动更新或新版本通知功能。从发布页面下载新版本，以相同方式重新安装。

- Linux `.deb` / `.rpm`：使用新文件再次运行相同命令，即可覆盖安装。
- macOS：用新的 `Tasty.app` 覆盖 `Applications` 中的旧版本。
- Windows `.msi`：运行新的 `.msi` 即可升级。用户数据（`~/.tasty/`）会保留。

设置、会话和主题均位于 `~/.tasty/` 中，更新后会保留。

## 卸载

| OS | 卸载程序 | 用户数据 |
|----|--------------|--------------|
| Linux `.deb` | `sudo apt remove tasty` | 保留 `~/.tasty/`。需手动删除 |
| Linux `.rpm` | `sudo dnf remove tasty` | 同上 |
| Linux AppImage / tar.gz | 删除文件、文件夹 | 同上 |
| macOS | 将 `Tasty.app` 移到废纸篓 | 同上 |
| Windows `.msi` | 在**设置 > 应用**中卸载 Tasty | **`~/.tasty/` 也会一并删除** — 如需保留设置、会话和主题，请在卸载前备份 |
| Windows `.zip` | 删除解压后的文件夹 | 保留 `~/.tasty/`。需手动删除 |
| 无界面压缩包（所有 OS） | 删除解压后的文件夹 | 保留 `~/.tasty/`。需手动删除 |

在 Windows 上，`~` 表示 `%USERPROFILE%`（通常为 `C:\Users\<姓名>`）。

## 安装位置

| OS | 可执行文件 | 用户数据 |
|----|----------|--------------|
| Linux | `/usr/bin/tasty`（`.deb` / `.rpm`）或解压位置 | `~/.tasty/` |
| macOS | `/Applications/Tasty.app/Contents/MacOS/tasty` | `~/.tasty/` |
| Windows | `C:\Program Files\tasty\bin\tasty.exe`（`.msi`） | `%USERPROFILE%\.tasty\` |

`~/.tasty/` 中包含设置（`config.toml`）、正在运行的 Tasty 的 IPC 端口（`tasty.port`）、布局、主题和日志。主要文件见[设置](../customize/settings.md)和[故障排除](../help/troubleshooting.md)。

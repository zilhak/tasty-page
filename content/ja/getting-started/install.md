<!-- source-hash: 5fd5baa8c993 -->
# インストール

Tasty の Windows・macOS・Linux 用インストールファイルは、GitHub リリースページからアーキテクチャ別にダウンロードできます。macOS は Apple Silicon をサポートしています。

インストールファイルは [GitHub リリースページ](https://github.com/zilhak/tasty/releases) からダウンロードしてください。現在、インストールスクリプトやパッケージマネージャー（apt リポジトリ、Homebrew、winget など）によるインストールは提供していません。

## インストールファイルを選ぶ

`{ver}` にはバージョン（例: `0.10.3`）が入ります。

**Linux 版 Tasty はどのファイル形式でも glibc 2.39 以上が必要です。** 以下の形式ごとの条件は ARM64 にも適用されます。バージョン番号の後ろの `+` は、そのバージョン以上を表します。

| OS | アーキテクチャ | ファイル | 説明 |
|----|---------|------|------|
| Linux | x86_64 | `tasty_{ver}-1_amd64.deb` | Ubuntu 24.04+ / Linux Mint 22+ / Debian 13+ |
| Linux | x86_64 | `tasty-{ver}-1.x86_64.rpm` | Fedora 40+ / openSUSE Leap 16.0+ / Tumbleweed |
| Linux | x86_64 | `Tasty-{ver}-x86_64.AppImage` | 単一ファイル。glibc 2.39+ が必要 |
| Linux | x86_64 | `tasty-{ver}-linux-x64.tar.gz` | 手動インストール用の圧縮ファイル |
| Linux | aarch64 | `_arm64.deb` / `.aarch64.rpm` / `-aarch64.AppImage` / `-linux-arm64.tar.gz` | ARM64 |
| Linux | x86_64 | `tasty-headless-{ver}-linux-x64.tar.gz` | [ヘッドレスビルド](#ヘッドレスビルド)（ウィンドウなしでサーバー上で実行） |
| Linux | aarch64 | `tasty-headless-{ver}-linux-arm64.tar.gz` | [ヘッドレスビルド](#ヘッドレスビルド) |
| macOS | Apple Silicon | `Tasty-{ver}-macos-arm64.dmg` | ドラッグしてインストールします。Intel Mac 用のビルドはありません |
| macOS | Apple Silicon | `tasty-headless-{ver}-macos-arm64.tar.gz` | [ヘッドレスビルド](#ヘッドレスビルド) |
| Windows | x86_64 | `tasty-{ver}-windows-x64.msi` | インストールウィザード（推奨） |
| Windows | x86_64 | `tasty-{ver}-windows-x64.zip` | 解凍するだけで使えるインストール不要版 |
| Windows | x86_64 | `tasty-headless-{ver}-windows-x64.zip` | [ヘッドレスビルド](#ヘッドレスビルド) |
| Windows | ARM64 | `tasty-{ver}-windows-arm64.msi` | インストールウィザード。0.12.2 以前のリリースにはありません。[Windows](#windows) を参照してください |
| Windows | ARM64 | `tasty-{ver}-windows-arm64.zip` | 解凍するだけで使えるインストール不要版 |
| Windows | ARM64 | `tasty-headless-{ver}-windows-arm64.zip` | [ヘッドレスビルド](#ヘッドレスビルド) |

各 OS の `SHA256SUMS-*.txt` で、ダウンロードしたファイルを検証できます。

サイトのトップページにあるダウンロードボタンは、ブラウザーが通知する OS とアーキテクチャに合うファイルがある場合に限り、そのファイルに直接リンクします。アーキテクチャが不明な場合はリリースページにリンクするので、上の表から自分のコンピューターのアーキテクチャに合うファイルを選んでください。

## Linux

表にないディストリビューションにも同じ glibc の条件が適用されます。`.deb` や `.rpm` のインストールには、必要なライブラリを提供するパッケージリポジトリが必要です。

RHEL 10 は glibc 2.39 を提供しており、最低条件を満たしています。RHEL の標準リポジトリだけでは、`.rpm` が必要とする WebKitGTK の依存関係を満たせません。

Ubuntu 22.04、Debian 12、RHEL 9、openSUSE Leap 15.6 では glibc のバージョンが古いため、パッケージのインストール時に glibc の依存関係エラーが発生するか、起動時に `GLIBC_2.39 not found` と表示されます。`ldd --version` を実行し、出力の 1 行目で glibc のバージョンを確認してください。古いディストリビューション向けのビルドは別途提供していません。

```sh
# .deb (Ubuntu 24.04+ / Linux Mint 22+ / Debian 13+)
sudo apt install ./tasty_{ver}-1_amd64.deb

# .rpm (Fedora 40+)
sudo dnf install ./tasty-{ver}-1.x86_64.rpm

# .rpm (openSUSE Leap 16.0+ / Tumbleweed)
sudo zypper install ./tasty-{ver}-1.x86_64.rpm

# .AppImage — インストールせずに実行
chmod +x Tasty-{ver}-x86_64.AppImage && ./Tasty-{ver}-x86_64.AppImage
# FUSE がない環境の場合
./Tasty-{ver}-x86_64.AppImage --appimage-extract-and-run

# .tar.gz — 解凍後すぐに実行
tar -xzf tasty-{ver}-linux-x64.tar.gz && ./tasty-linux-x64/tasty
```

- `.deb` / `.rpm` は `tasty` コマンドを PATH に登録し、アプリメニューにアイコンを追加します。パッケージマネージャーが必要なライブラリを一緒にインストールします。
- GPU アクセラレーション（Vulkan）は `libvulkan1` / `vulkan-loader` がある場合に使用します。なくてもインストール・実行は可能で、OpenGL、それも使えない場合はソフトウェアレンダリングで動作します。
- `zenity` は推奨パッケージです。すでに実行中の Tasty に新たな起動要求を渡せなかったときに、案内ダイアログを表示するために使います。ない場合はデスクトップ通知で代わりに知らせます。
- `.AppImage` は実行に使うライブラリの一部を同梱し、glibc はシステムにインストールされているものを使います。アプリメニューへの登録は自分で行ってください（`appimaged` を使用するか、`.desktop` ファイルを `~/.local/share/applications/` に配置してください）。
- `.tar.gz` は PATH 登録とメニュー登録を自分で行う必要があります。必要なシステムライブラリがない場合は、`tasty` の実行時に何が不足しているかを案内して終了します。
- ライセンス表記（Tasty の MIT ライセンス本文・同梱するフォントと markdown レンダリングエンジンのライセンス本文・第三者に関する告知文書）は配布物内に同梱されています。配置場所は、`.deb` では `/usr/share/doc/tasty/`、`.rpm` と `.AppImage` では `usr/share/licenses/tasty/`、`.tar.gz` では解凍したディレクトリの最上位です。
- HTML・Markdown ビューアには WebKitGTK 2.40 以上が必要です。Ubuntu 24.04 では `libwebkit2gtk-4.1-0` パッケージがこのライブラリを提供します。

## macOS

1. `.dmg` を開き、`Tasty.app` を `Applications` フォルダーにドラッグしてください。
2. 初回起動時に「未確認の開発元」という警告が表示された場合は、**システム設定 > プライバシーとセキュリティ** で許可してください。

ターミナルから直接警告を消すには:

```sh
xattr -dr com.apple.quarantine /Applications/Tasty.app
```

初回起動直後は、macOS の権限プロンプト（ダウンロード・書類・デスクトップフォルダー、画面収録）が順に表示される場合があります。表示されるかどうかは、以前の承認状況と macOS のポリシーによって異なります。表示される理由と応答方法は [トラブルシューティング](../help/troubleshooting.md#macos-の権限プロンプト) にあります。

## Windows

Windows ARM デバイスでは、名前に `windows-arm64` を含むファイルをダウンロードしてください。ARM64 ファイルは 0.12.2 より新しいリリースから含まれています。

Windows ARM もサポート対象です。

- **`.msi`（推奨）** — ダブルクリックしてインストールウィザードに従ってください。スタートメニューのショートカットと「アプリと機能」のアンインストール項目が登録されます。
- **`.zip`** — 任意のフォルダーに解凍して `tasty.exe` を実行してください。

```powershell
Expand-Archive tasty-{ver}-windows-x64.zip -DestinationPath tasty
.\tasty\tasty.exe
```

初回起動時に「Windows によって PC が保護されました」という警告が表示されます（コード署名がないためです）。**詳細情報 → 実行** を押してください。

Windows では Tasty は Git for Windows の **Git Bash**（`bash.exe`）のみをシェルとして実行します。Git for Windows をインストールしてください。シェル設定が空の場合は、既定のインストール先から Git Bash を探して使用します。別の場所にインストールした場合は、**設定** <!-- en: Settings --> > **ターミナル** <!-- en: Terminal --> > **シェル** <!-- en: Shell --> にその `bash.exe` のパスを入力してください。設定が空で既定のインストール先にも見つからない場合、保存された値が Git Bash ではない場合、または保存されたパスにファイルがない場合は、起動時にターミナルの代わりに **シェルを選択** <!-- en: Choose a shell --> 画面が表示されます。Git Bash の `bash.exe` のパスを入力して **このシェルを使用** <!-- en: Use this shell --> を押すと、パスを保存して Tasty を起動します。このボタンは、判定行で Git Bash が見つかったと表示される場合にのみ有効になります。**終了** <!-- en: Quit --> を押すと、保存された値を変更せずに Tasty を閉じます。実行中にシェル設定を Git Bash ではない値やファイルのないパスに変更すると、新しいターミナルを開けなくなり、設定ウィンドウの **ターミナル** タブに原因が表示されます。

## 初回起動

- ウィンドウが開くと、ワークスペースが 1 つとターミナルが 1 つ用意されています。画面構成は [最初の画面を見てみる](first-look.md) にあります。
- UI 言語の既定値は英語です。韓国語に変更するには、**設定** > **一般** <!-- en: General --> > **言語** <!-- en: Language --> で韓国語を選んで保存し、Tasty を再起動してください。`~/.tasty/config.toml` に直接記述することもできます:

```toml
[general]
language = "ko"
```

ターミナルで、インストールが正常に完了したか確認してください。2 番目のコマンドは Tasty が実行中の場合に応答します。

```sh
tasty --version      # 例: tasty 0.10.3
tasty list info      # 実行中の Tasty のバージョン・ワークスペース数
```

Tasty 内で開いたシェルでは、`tasty` コマンドが自動的に PATH に追加されます。macOS でほかのターミナルアプリやスクリプトからも使うには、`/Applications/Tasty.app/Contents/MacOS/tasty` を PATH に追加するか、シンボリックリンクを作成してください。Windows の `.zip` 版も同様に、解凍したフォルダーを PATH に追加してください。

## GPU の要件

Tasty は GPU（Vulkan / DirectX 12 / Metal）で画面を描画します。GPU がない場合はソフトウェアレンダラーでもう一度試し、それも使えない場合はウィンドウを表示せずに終了します。このとき画面にはエラーが表示されず、ログ（`~/.tasty/debug.log`、ターミナルから起動した場合はターミナル出力）に「GPU アダプターが見つかりません」と記録されます。GPU ドライバーをインストール・更新すると、ほとんどの場合は解決します。名前に `headless` を含まないインストールファイルはすべて GUI ビルドです。グラフィカルな画面なしでサーバー上で実行するには、以下のヘッドレスビルドを使用してください。

## ヘッドレスビルド

ウィンドウなしでサーバー上で Tasty を動かす **ヘッドレスビルド** は、リリースページに OS 別の圧縮ファイル（名前が `tasty-headless-` で始まります）として公開されます。解凍するだけで使い、`.deb`・`.rpm`・`.AppImage`・`.dmg`・`.msi` のようなインストールファイルでは配布していません。GUI ビルドと実行ファイル名がどちらも `tasty` なので、GUI 版とは別のフォルダーに解凍してください。同梱プラグインは圧縮ファイル内の `plugins/` に含まれています。

```sh
# Linux (aarch64 では x64 を arm64 に置き換えてください)
tar -xzf tasty-headless-{ver}-linux-x64.tar.gz && ./tasty-headless-linux-x64/tasty

# macOS (Apple Silicon)
tar -xzf tasty-headless-{ver}-macos-arm64.tar.gz && ./tasty-headless-macos-arm64/tasty
```

```powershell
# Windows (ARM64 では x64 を arm64 に置き換えてください)
Expand-Archive tasty-headless-{ver}-windows-x64.zip -DestinationPath tasty-headless
.\tasty-headless\tasty.exe
```

macOS でブラウザーからダウンロードしたファイルは、実行時に「未確認の開発元」という警告が表示される場合があります。その場合は `xattr -dr com.apple.quarantine tasty-headless-macos-arm64` で隔離属性を削除してください。

ヘッドレスビルドの `tasty` はオプションなしで実行してもウィンドウなしで起動し、ターミナルの作成と操作は `tasty` CLI でのみ行います。別のコンピューターから [リモートアタッチ](../remote/attach.md) で、そのワークスペースを取り込んで表示できます。GUI ビルドに `--headless` を付けて実行しても、ウィンドウなしでは起動せず、通常どおり GUI で起動します。

Tasty を 2 つ同時に実行するには、`TASTY_HOME` でインスタンスごとに別のデータフォルダーを指定してください。実行中の Tasty が同じデータフォルダーのロックを保持し続けている場合、ヘッドレスビルドは標準エラー出力にメッセージを書き込み、終了コード 1 で終了します。詳しくは [Tasty を再び起動した場合](../help/troubleshooting.md#tasty-を再び起動した場合)を参照してください。

配布ファイルがない環境（例: Intel Mac）では、Rust がインストールされた環境でソースから直接ビルドしてください。

```sh
git clone https://github.com/zilhak/tasty.git
cd tasty
cargo build --release --no-default-features
./target/release/tasty
```

## アップデート

自動アップデートや新しいバージョンの通知機能はありません。リリースページから新しいバージョンをダウンロードし、同じ方法で再インストールしてください。

- Linux `.deb` / `.rpm`: 新しいファイルで同じコマンドを再実行すると、上書きインストールされます。
- macOS: 新しい `Tasty.app` で `Applications` 内のものを上書きしてください。
- Windows `.msi`: 新しい `.msi` を実行するとアップグレードされます。ユーザーデータ（`~/.tasty/`）はそのまま残ります。

設定・セッション・テーマはすべて `~/.tasty/` にあるため、アップデートしても保持されます。

## アンインストール

| OS | プログラムの削除 | ユーザーデータ |
|----|--------------|--------------|
| Linux `.deb` | `sudo apt remove tasty` | `~/.tasty/` は残ります。自分で削除してください |
| Linux `.rpm` | `sudo dnf remove tasty` | 上と同じです |
| Linux AppImage / tar.gz | ファイル・フォルダーを削除してください | 上と同じです |
| macOS | `Tasty.app` をゴミ箱に移動してください | 上と同じです |
| Windows `.msi` | **設定 > アプリ** で Tasty をアンインストールしてください | 既定では `~/.tasty` が残ります |
| Windows `.zip` | 解凍したフォルダーを削除してください | `~/.tasty/` は残ります。自分で削除してください |
| ヘッドレス圧縮ファイル（すべての OS） | 解凍したフォルダーを削除してください | `~/.tasty/` は残ります。自分で削除してください |

ユーザーデータも削除するには、Windows の設定アプリの一覧で Tasty の **変更** <!-- en: Modify --> → **Remove** を選ぶか、`.msi` を再実行して **Remove** を選んでください。アンインストール画面で **Permanently delete settings, history, saved logins and profiles in .tasty** にチェックを入れてください。その状態でアンインストールが正常に完了すると、インストーラーは `~/.tasty` の削除を試みます。削除できないファイルがありデータが残った場合は、**Tasty data deletion incomplete** ダイアログが表示されます。

アプリの一覧で直接 **アンインストール** <!-- en: Uninstall --> を選ぶか、`msiexec /qn` または `msiexec /qb` でアンインストールすると、ユーザーデータは残ります。アップグレードと修復でも残ります。

Windows では `~` は `%USERPROFILE%`（通常は `C:\Users\<名前>`）です。

## インストール先

| OS | 実行ファイル | ユーザーデータ |
|----|----------|--------------|
| Linux | `/usr/bin/tasty`（`.deb` / `.rpm`）または解凍した場所 | `~/.tasty/` |
| macOS | `/Applications/Tasty.app/Contents/MacOS/tasty` | `~/.tasty/` |
| Windows | `C:\Program Files\tasty\bin\tasty.exe`（`.msi`） | `%USERPROFILE%\.tasty\` |

`~/.tasty/` には設定（`config.toml`）、実行中の Tasty の IPC ポート（`tasty.port`）、レイアウト、テーマ、ログが入ります。主なファイルは [設定](../customize/settings.md) と [トラブルシューティング](../help/troubleshooting.md) で扱います。

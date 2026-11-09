<!-- source-hash: 5662d7916a3a -->
# インストール

Tasty の Windows・macOS・Linux 用インストールファイルは、GitHub リリースページからアーキテクチャ別にダウンロードできます。macOS は Apple Silicon をサポートしています。

インストールファイルは [GitHub リリースページ](https://github.com/zilhak/tasty/releases) からダウンロードしてください。現在、インストールスクリプトやパッケージマネージャー（apt リポジトリ、Homebrew、winget など）によるインストールは提供していません。

## インストールファイルを選ぶ

`{ver}` にはバージョン（例: `0.10.3`）が入ります。

| OS | アーキテクチャ | ファイル | 説明 |
|----|---------|------|------|
| Linux | x86_64 | `tasty_{ver}-1_amd64.deb` | Debian / Ubuntu / Mint |
| Linux | x86_64 | `tasty-{ver}-1.x86_64.rpm` | Fedora / RHEL / openSUSE |
| Linux | x86_64 | `Tasty-{ver}-x86_64.AppImage` | ディストリビューションを問わない単一ファイル |
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

```sh
# .deb (Debian / Ubuntu / Mint)
sudo apt install ./tasty_{ver}-1_amd64.deb

# .rpm (Fedora / RHEL / openSUSE)
sudo dnf install ./tasty-{ver}-1.x86_64.rpm

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
- `.AppImage` は実行に使うライブラリをまとめて配布します。アプリメニューへの登録は自分で行ってください（`appimaged` を使用するか、`.desktop` ファイルを `~/.local/share/applications/` に配置してください）。
- `.tar.gz` は PATH 登録とメニュー登録を自分で行う必要があります。必要なシステムライブラリがない場合は、`tasty` の実行時に何が不足しているかを案内して終了します。
- ライセンス表記（Tasty の MIT ライセンス本文・同梱するフォントと markdown レンダリングエンジンのライセンス本文・第三者に関する告知文書）は配布物内に同梱されています。配置場所は、`.deb` では `/usr/share/doc/tasty/`、`.rpm` と `.AppImage` では `usr/share/licenses/tasty/`、`.tar.gz` では解凍したディレクトリの最上位です。
- ビルドの基準が Ubuntu 24.04（glibc 2.39）のため、それより古いディストリビューション（Ubuntu 20.04、Debian 11 など）では `GLIBC_2.39 not found` エラーで起動しない場合があります。古いディストリビューション向けのビルドは別途提供していません。
- HTML・Markdown ビューアには WebKitGTK 2.40 以上が必要です。ビルドの基準である Ubuntu 24.04 の `libwebkit2gtk-4.1` はこの条件を満たしています。

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

Windows では Tasty は **Git Bash** をシェルとして使います。Git for Windows がない状態で初めて起動すると、ターミナルの代わりに **シェルを選択** <!-- en: Choose a shell --> 画面が表示されます。bash.exe のパスを入力して **このシェルを使用** <!-- en: Use this shell --> を押すとそのシェルで起動し、**終了** <!-- en: Quit --> を押すと Tasty が閉じます。パスが有効な bash または zsh の実行ファイルである場合に限り、**このシェルを使用** を押せます。起動後も設定されたシェルのパスが正しくない場合は、設定ウィンドウの **ターミナル** <!-- en: Terminal --> タブに「Git Bash が見つかりません」という案内が表示されます。その場合は Git for Windows をインストールするか、**設定** <!-- en: Settings --> > **ターミナル** <!-- en: Terminal --> > **シェル** <!-- en: Shell --> で bash のパスを直接指定してください。

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
| Windows `.msi` | **設定 > アプリ** で Tasty をアンインストールしてください | **`~/.tasty/` も一緒に削除されます** — 設定・セッション・テーマを残すには、アンインストール前にバックアップしてください |
| Windows `.zip` | 解凍したフォルダーを削除してください | `~/.tasty/` は残ります。自分で削除してください |
| ヘッドレス圧縮ファイル（すべての OS） | 解凍したフォルダーを削除してください | `~/.tasty/` は残ります。自分で削除してください |

Windows では `~` は `%USERPROFILE%`（通常は `C:\Users\<名前>`）です。

## インストール先

| OS | 実行ファイル | ユーザーデータ |
|----|----------|--------------|
| Linux | `/usr/bin/tasty`（`.deb` / `.rpm`）または解凍した場所 | `~/.tasty/` |
| macOS | `/Applications/Tasty.app/Contents/MacOS/tasty` | `~/.tasty/` |
| Windows | `C:\Program Files\tasty\bin\tasty.exe`（`.msi`） | `%USERPROFILE%\.tasty\` |

`~/.tasty/` には設定（`config.toml`）、実行中の Tasty の IPC ポート（`tasty.port`）、レイアウト、テーマ、ログが入ります。主なファイルは [設定](../customize/settings.md) と [トラブルシューティング](../help/troubleshooting.md) で扱います。

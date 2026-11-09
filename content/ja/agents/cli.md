<!-- source-hash: ea95539b4b25 -->
# tasty CLI でターミナルを操作する

`tasty` CLI は、実行中の Tasty に接続してターミナルを作成し、入力を送り、出力を読むコマンドを提供します。接続と対象 ID を確認してからコマンドを送り、`read since-mark` でマークした位置以降の出力を読んでください。スクリプトと AI エージェントが同じコマンドを使えます。

初めて使うときは、このページを順番に進めてください。接続を確認し、対象 ID を探し、作業用ターミナルを 1 つ作成してコマンドを送り、出力を読んでから片付けます。読み取り位置の指定・メタデータ・キュー・メモリなどの残りのコマンドは [CLI コマンドリファレンス](cli-reference.md)に、応答の遅延・接続・エラーコード別の対処は [CLI の応答遅延と接続診断](../help/cli-diagnostics.md)にあります。

## 準備

- Tasty が実行中である必要があります。CLI は `~/.tasty/tasty.port` に記載されたポートで、実行中のインスタンスに接続します。
- Tasty が開いたターミナル内では、`tasty` はすでに PATH にあります。外部（別のターミナルアプリ）で使うには、Tasty の実行ファイルがあるパスを PATH に追加してください。インストール方法別のパスは[インストール](../getting-started/install.md#インストール先)にあります。
- Tasty が起動したシェルには、`TASTY_SURFACE_ID` 環境変数が設定されています。`--surface` を省略したコマンドの多くはこの値を使うため（`tasty new workspace` · `tasty output observe start` は例外）、自分のターミナルを操作するときは ID を書く必要がありません。
- Codex プラグインがインストールされている場合、Codex のコマンド実行内（`CODEX_THREAD_ID` がある環境）では、そのシェルの `TASTY_SURFACE_ID` が別のターミナルの値である可能性があるため、プラグインが追加したコマンド（例: `tasty codex …`、`tasty claude …`）はこの値で `--surface` を補いません。対象が必要な場合は `--surface` で指定してください。`CODEX_THREAD_ID` の値が正しくない場合、`tasty codex …`・`tasty claude …` は実行されず、ほかのプラグインコマンドは通常どおり実行されます。
- 別の Tasty のターミナルから Tasty を実行しても、新しい Tasty が起動したシェルとフックコマンドは、外側の Tasty のセッショントークン（`TASTY_SESSION_TOKEN`）とエージェント ID（`TASTY_AGENT_ID`）を引き継ぎません。その中で呼び出した `tasty` コマンドは、新しい Tasty に一般ユーザーとして接続します。

```sh
echo $TASTY_SURFACE_ID     # 例: 42
tasty list info            # バージョン・照会したウィンドウのワークスペース数 — 接続確認用
```

## 用語と ID

Tasty の画面は **ワークスペース > ペイン > タブ > サーフェス** の順に入れ子になっています。サーフェス（surface）は、ターミナルや Markdown 文書のように実際の内容を表示する領域です。対象 ID を直接指定したコマンドは、どのウィンドウにフォーカスがあってもその対象を使います。

```sh
tasty list tree            # 階層全体をツリーで表示
tasty list workspaces      # ワークスペース一覧
tasty list surfaces        # サーフェス(ターミナル)一覧 — 全ワークスペース
tasty list panes           # ペイン一覧
tasty list tabs --pane 3   # 特定のペインのタブ
tasty list surface-kinds   # このインスタンスが実際に登録したサーフェスの種類
```

`list tree` は分割構造も表示します。フォーカスされたサーフェスには `*focus` が付きます。

```
└─ vertical (L|R) 60:40
   ├─ surface:396 (terminal)
   └─ horizontal (T|B) 50:50
      ├─ surface:417 (terminal) *focus
      └─ surface:418 (markdown)
```

`list surface-kinds` は、現在 `--type <種類>` で作成できるサーフェスの種類を表示します。プラグインが実行されていない場合や、現在のビルドが対応していない種類は一覧に表示されません。プラグインを無効化または削除すると、そのプラグインの種類はすぐに一覧から外れ、その種類を作成するリクエストは、提供元のプラグインが無効になっているか、まだ再接続されていないというエラーで終了します。各行で、描画方式と機能を提供するプラグインまたは組み込み機能を確認できます。

`list workspaces` の行は `名前 (id:N) (ペイン数)` 形式です。アクティブなワークスペースには `*`、リモートミラーには `[mirror]` が付きます（[リモート作業を続ける](../remote/attach.md)）。

## 初めての実習: 作業用ターミナルでコマンドを実行する

ユーザーが使っているターミナルにコマンドを送らず、作業用タブを別に作成し、その ID で作業してください。以下の例の `3` と `57` は仮の値です。実際には、前のコマンドの応答にある値を使います。

```sh
tasty list panes                               # タブを作成するペイン ID を確認 (例: 3)
tasty new tab --pane 3 --cwd ~/proj            # 応答の surface_id が新しいターミナル (例: 57)
tasty set mark --surface 57                    # 現在の出力位置にマーク
tasty read last-command --surface 57           # 送信前の ended_at を記憶
tasty send text "ls\r" --surface 57            # コマンドを送信 (\r が Enter)
tasty read last-command --surface 57           # ended_at が変わればコマンドが終了
tasty read since-mark --surface 57 --strip-ansi # マーク以降の出力を読む
tasty close surface --surface 57               # 使い終わったターミナルを片付ける
```

- `new tab` で作成したタブは、ユーザーが見ていたタブを切り替えません。応答の `active_tab` ではなく `surface_id` を使ってください。
- コマンドが終了したかどうかを、一定時間待ったことや出力が空であることだけで判断しないでください。bash・zsh ではシェル統合がコマンドごとに終了記録を残すため、送信前後の `read last-command` の応答で `ended_at` が変わったかどうかと `exit_code` を確認してください。シェル統合がないシェルでは、`read screen` でプロンプトが戻ったかどうかを確認してください。
- 1 つのコマンドの引数をすべて見るには、`tasty help <コマンド>` を実行してください。例: `tasty help read since-mark`。

## よく使うコマンドの一覧

| やりたいこと | コマンド |
|---|---|
| 階層構造を見る | `tasty list tree` |
| サーフェス一覧 | `tasty list surfaces` |
| 作業用タブを作成する | `tasty new tab --pane ID` |
| テキストを送る（Enter を含む） | `tasty send text "ls\r" --surface ID` |
| キーを送る | `tasty send key enter --surface ID` |
| マークを付ける | `tasty set mark --surface ID` |
| マーク以降を読む | `tasty read since-mark --surface ID --strip-ansi` |
| 最後のコマンドの終了記録 | `tasty read last-command --surface ID` |
| 画面を読む | `tasty read screen --surface ID --lines N` |
| サーフェスを閉じる | `tasty close surface --surface ID` |
| 通知 | `tasty notify "本文" --title "タイトル"` |
| スクリーンショット | `tasty screenshot --path out.png [--surface ID] [--window ID]` |
| ヘルプ | `tasty help`、`tasty help <コマンド>`（= `tasty <コマンド> --help`）、`tasty -a`（すべてのコマンドパスと短い説明。引数は各コマンドの `--help`） |

`tasty help` は、基本操作・エージェント連携・バックグラウンド・リモートのように目的別にコマンドをまとめて表示し、先頭で最初の作業手順を案内します。`-h` は短い説明、`--help` と `tasty help <コマンド>` は詳しい説明を表示します。Claude・Codex のヘルプの最後にある「内部連携」グループは、フックが呼び出すコマンドなので直接入力しません。

## 基本パターン: マーク → 送信 → マーク以降を読む

コマンドを送る前にマークを残し、それ以降の出力を読む手順です。同じターミナルから出たほかの出力も含まれる場合があります。

1. `tasty set mark` — 現在の出力位置にマークを残します。
2. `tasty send text "コマンド\r"` — テキストを送ります。`\r` が Enter です。
3. コマンドが終了した後に `tasty read since-mark --strip-ansi` — マーク以降に出た出力だけを読みます。

```sh
tasty set mark --surface 42
tasty send text "cargo test 2>&1 | tail -20\r" --surface 42
# 終了したかどうかは、下の初めての実習と同じように read last-command または read screen で確認します
tasty read since-mark --surface 42 --strip-ansi
```

- `send text` は `\r` `\n` `\t` `\\` `\0` のエスケープを解釈します。シェルの引用符の中にそのまま書いてください。
- `--strip-ansi` を付けると、色などの制御シーケンスを取り除いたプレーンテキストが返ります。解析するときは必ず付けてください。
- マークは `set mark` を再度呼び出すまで維持されます。`read since-mark` はマークを移動しないため、何度読んでも同じ範囲が返ります。

コマンドが終了したかどうかわからないときは、画面を読んでプロンプトが戻ったかどうかを確認してください。

```sh
tasty read screen --surface 42 --lines 5     # 画面下部の 5 行 (足りなければスクロールバックまで)
tasty is-typing --surface 42                  # 直近 5 秒以内に人がキーを押すか貼り付けたか
```

`read screen` は、標準では薄く表示される自動補完候補（例: Claude Code の灰色の候補テキスト）を除外します。含めるには `--show-dim` を指定してください。この除外は入力候補だけでなく、薄く描画されたすべての文字に適用されます。応答の `dim_omitted_rows` が 0 より大きい場合、薄い文字のために内容が変わった行があるので、`--show-dim` でもう一度読んで比較してください。

リモート接続（attach）で開いたミラーターミナルで `read screen`・`read since-mark`・`set mark` を使うと、リモートコンピューターの元のターミナルを読みます。一度に受け取る出力が少なくなる場合があるため、応答の `next_cursor` で続きを読んでください。リモートの Tasty がこの機能に対応していない場合や接続が切れている間はエラーを返すため、リモートの Tasty を同じバージョンに更新するか、再接続された後に読んでください。

`--lines N` より少ない行数が返る場合は、応答の `scrollback_len` を確認してください。値が `0` なら、これ以上読むスクロールバックがないという意味です。全画面アプリ（TUI）を初めて実行したときに、このような場合があります。スクロールバックが残っているのに要求した行数より少なく返る場合は、出力の照会を確認してください。`alt_screen` は、現在全画面アプリを使用中かどうかを示します。

## キーを送る

Enter 以外のキーは `send key` で送ります。

```sh
tasty send key enter --surface 42
tasty send key ctrl+c --surface 42
tasty send key escape --surface 42
tasty send key up --surface 42
```

キー名: `enter` `tab` `escape`（または `esc`）`backspace` `delete` `insert` `up` `down` `left` `right` `home` `end` `pageup` `pagedown` `f1`～`f12`。組み合わせは `ctrl+c` `alt+x` のように `+` でつなぎます。`shift+` は受け付けますが無視されます。

## シェル統合がある場合: コマンド単位で読む

bash / zsh では Tasty がシェル統合を自動で設定するため、実行したコマンドと終了コードをコマンド単位で照会できます。

```sh
tasty read commands --surface 42       # 記録されたコマンド一覧
tasty read last-command --surface 42   # 最後のコマンド (コマンド文字列・終了コード)
tasty read command-at --surface 42 --index -1   # 後ろから 1 番目 (0 始まり、負数は末尾から)
```

fish などのほかのシェルでは、自分でシェル統合をインストールしなければ空の一覧が返ります。

## 新しいターミナルの作成・終了

```sh
tasty new workspace --name build --cwd ~/proj          # 新しいワークスペース
tasty new workspace --surface 42                       # サーフェス 42 があるウィンドウに新しいワークスペース (作業ディレクトリもサーフェス 42 から)
tasty new window                                        # 新しいウィンドウ (応答に window_id)
tasty split --level surface --surface this --direction vertical  # 自分のサーフェスを左右に分割
tasty split --level pane --pane 3 --direction horizontal          # ペインを分割
tasty new tab --pane 3 --cwd ~/proj                     # ペインに新しいタブ
tasty close surface --surface 99                        # サーフェスを閉じる
tasty close tab --tab 12
tasty close workspace --workspace 3                     # ワークスペース全体 (中のタブ・サーフェスも含む)
tasty close window --window 1                           # ウィンドウを閉じる
tasty close self                                        # 現在のこのサーフェスを閉じる
```

以前の表記 `split --target-surface`・`--target-pane`、`close workspace|window --id` も引き続き受け付けます。両方の表記を同時に指定すると、同じオプションを 2 回指定したものとして拒否します。

`--surface this` は自分自身（`TASTY_SURFACE_ID`）です。`--type markdown --file README.md` のように、ターミナル以外のサーフェスも作成できます（[ファイルの管理と表示](../using/files.md)）。`new workspace` · `new tab` · `split` の `--cwd` はエクスプローラー（`--type explorer`）でも使え、`--path` がなければそのフォルダーをルートとして開きます。両方を書くと `--path` が優先されます。エクスプローラーは `--cwd` を省略してもほかのサーフェスの作業ディレクトリを引き継がず、ホームを開きます。

`tasty new tab` で開いたタブは、種類にかかわらずユーザーが見ていたタブを切り替えません。新しいタブはペインの最後に追加され、ユーザーが選ぶまで背後にあります。応答の `active_tab` は新しいタブではなく、そのペインで現在選択されているタブなので、新しいタブを扱うときは応答の `surface_id` を使ってください。ショートカットやメニューでユーザーが直接開いたタブは、すぐに選択されます。

`tasty new window` で開いたウィンドウは、ユーザーが見ていたウィンドウからフォーカスを奪いません。そのため、続けて対象を指定しないコマンド（`tasty new workspace` など）を実行すると、新しいウィンドウではなく、ユーザーが見ていたウィンドウに作成されます。

新しいウィンドウにワークスペースを作成するには、そのウィンドウのサーフェス ID を `tasty new workspace --surface <ID>` で指定してください — `tasty list windows` はウィンドウごとの `workspace_ids` を、`tasty list surfaces` はサーフェスごとの `workspace_id` を表示します。指定したサーフェスがどのウィンドウにもない場合、コマンドは別のウィンドウに流れず、エラーで終了します。`--cwd` を省略すると、新しいワークスペースの作業ディレクトリは指定したサーフェスのものを引き継ぎます（そのウィンドウでユーザーが見ているサーフェスではありません）。

新しいウィンドウは、ユーザーが見ていたウィンドウの背後に作成され、キー入力も奪いません（macOS · Windows）。Linux の X11 ではウィンドウマネージャーにそのように要求しますが、従うかどうかはウィンドウマネージャーが決め、Wayland ではコンポジターが決めます。どちらの場合も、対象のないコマンドが送られるウィンドウは変わりません。

ワークスペースとウィンドウは、最後の 1 つを閉じられません。ワークスペースを閉じるとウィンドウまで消えるのではなく
拒否されるため、ウィンドウを閉じるつもりなら `tasty close window` を別に使ってください（ウィンドウなしで動く
[ヘッドレスビルド](../getting-started/install.md#ヘッドレスビルド)には閉じるウィンドウがないため、最後のワークスペースはそのままでは閉じられません）。自分のターミナルが含まれる対象は
閉じられません — その場合は `tasty close self` です。リモートに接続してミラーとして開いたワークスペースも閉じられません —
それは接続を切断して片付けます。逆に、**誰かがリモートから接続して現在使っているターミナル**が含まれる
ワークスペースも閉じられません — その人が接続を切断して初めて閉じられます。見ていないワークスペースを閉じても、画面に表示されているワークスペースは
そのまま残ります。

**ワークスペースを閉じる操作は取り消せません。** 中で動いていたターミナルはすべて終了し、「閉じた項目」から
復元できず、スクロールバックも残りません。閉じた項目の復元は、ユーザーが画面で直接閉じた項目にのみ適用されます。
閉じようとしている対象が正しいか、`tasty list workspaces` で先に確認してください。

## 人が入力中の場合は送信しない

```sh
tasty send text "make test\r" --surface 42 --wait-idle
```

`--wait-idle` は判定と送信を一度に行います。`tasty is-typing` で先に確認してから送ると、その間に
人が入力を始める可能性がありますが、このフラグはその隙間をなくします。入力中なら送信せず、
`"sent": false` と理由を返します。

## トラブルシューティング

- **接続できません** — Tasty が実行中か、`~/.tasty/tasty.port` ファイルがあるかを確認してください。ファイルが残っていても、以前の実行時のファイルや別のインスタンスのパスである可能性があります（[トラブルシューティング](../help/troubleshooting.md)）。
- **`--surface` なしで呼び出すと拒否されます** — `TASTY_SURFACE_ID` がないシェル（Tasty の外部）では対象サーフェスがわからないため、コマンドはエラーで終了します。Tasty はフォーカスされたサーフェスを推測しません — どのウィンドウが手前にあっても、同じコマンドは同じ結果を返します。スクリプトでは必ず `--surface` を書いてください。
- **`read since-mark` が空です** — マークを付ける前に出力が終了したか、コマンドがまだ終了していません。`read screen` で現在の状態を見てください。
- **`screenshot` がどのウィンドウを撮影するのかわかりません** — 自動選択では**メインウィンドウ（ターミナルウィンドウ）だけ**を数えます。メインウィンドウが 1 つなら `--window` なしでそのウィンドウを撮影し、メインウィンドウが複数ある場合は `--window` が必須です（フォーカスされたウィンドウを勝手に選びません）。設定ウィンドウのように `list windows` に表示されないウィンドウは、この計算に含まれません — 設定ウィンドウが開いていても `--window` なしでメインウィンドウが撮影され、設定ウィンドウ自体を撮影するには `--window` でその ID を直接指定してください。

応答がないときに、シェルの `timeout` で `tasty` を中断し、同じリクエストを繰り返さないでください。接続を閉じても、送信済みのリクエストはキャンセルされません。Tasty が処理中に蓄積したリクエストは後からまとめて実行される場合があり、入力を送るコマンドだった場合は同じ入力が繰り返されます。

応答待ちに期限が必要な場合は、1 回のリクエストで完結するコマンドに `--response-timeout-ms` を使い、フラグはコマンドの前に書いてください。期限内に処理を開始できなかったリクエストは `Error (-32067)` で終了し、後からも実行されません。処理を開始した後に期限を過ぎると `Error (-32061)` で終了し、結果は不明で、処理が続く場合があります。繰り返し問い合わせるコマンドや接続を維持するコマンドは、このフラグを受け取るとリクエストを送らず、終了コード 2 で拒否します。再送してよい場合と先に状態を確認する場合は、[応答待ちに上限を設ける](../help/cli-diagnostics.md#応答待ちに上限を設ける)で説明しています。ほかのエラーコード別の対処は、[CLI の応答遅延と接続診断](../help/cli-diagnostics.md)で確認できます。

## ほかのコマンドを探す

入門で扱っていないコマンドは、目的別のページにあります。

- <a id="複数のエージェントが同じターミナルを読む場合-位置を保持して読む"></a>[複数のエージェントが同じターミナルを読む場合: 位置を保持して読む](cli-reference.md#複数のエージェントが同じターミナルを読む場合-位置を保持して読む)
- <a id="サーフェスの中を見る"></a><a id="サーフェスの状態確認"></a>[サーフェスの状態確認](cli-reference.md#サーフェスの状態確認)
- <a id="子エージェントに権限を与える"></a>[子エージェントに権限を与える](cli-reference.md#子エージェントに権限を与える)
- <a id="通知を送る"></a>[通知を送る](cli-reference.md#通知を送る)
- <a id="サーフェスにメモを残す-メタデータ"></a>[サーフェスにメモを残す（メタデータ）](cli-reference.md#サーフェスにメモを残すメタデータ)
- <a id="サーフェス間でメッセージをやり取りする-キュー"></a>[サーフェス間でメッセージをやり取りする（キュー）](cli-reference.md#サーフェス間でメッセージをやり取りするキュー)
- <a id="子ターミナルをエージェントのように動かす"></a><a id="複数のターミナルにタスクを任せる"></a>[複数のターミナルにタスクを任せる](cli-reference.md#複数のターミナルにタスクを任せる)
- <a id="画面のない-pty"></a>[画面のない PTY](cli-reference.md#画面のない-pty)
- <a id="エージェントが共有するメモリ"></a>[エージェントが共有するメモリ](cli-reference.md#エージェントが共有するメモリ)
- <a id="出力からシグナルを取り出す-オブザーバー"></a><a id="出力から必要な情報を集める-オブザーバー"></a>[出力から必要な情報を集める（オブザーバー）](cli-reference.md#出力から必要な情報を集めるオブザーバー)
- <a id="エージェントの活動計測"></a><a id="エージェントの使用量確認"></a>[エージェントの使用量確認](cli-reference.md#エージェントの使用量確認)
- <a id="その他の照会と設定"></a>[その他の照会・設定](cli-reference.md#その他の照会設定)
- <a id="応答待ちに上限を設ける"></a>[応答待ちに上限を設ける](../help/cli-diagnostics.md#応答待ちに上限を設ける)
- <a id="応答の遅延と接続状態の確認"></a><a id="接続数と上限-connections"></a><a id="時間分布"></a><a id="データベース設定-db_pragmas"></a><a id="画面の転送-stream_push"></a><a id="リクエストキュー-queue_admission-queue_dispatch"></a><a id="重複リクエストの処理-keyed_requests"></a><a id="遅いリクエストの詳細-slow_requests"></a><a id="リクエストの拒否理由-gate_refusals"></a>[応答の遅延と接続状態の確認](../help/cli-diagnostics.md#応答の遅延と接続状態の確認)

<a id="次に読むもの"></a>

## あわせて読む

- [Claude・Codex と一緒に使う](claude-codex.md) — 子エージェントを起動し、完了通知を受け取ります。
- [タスクの順序管理](tasks.md) — 複数のタスクを依存関係でまとめ、順番に実行します。
- [フック・通知・webhook](hooks-notifications.md) — イベントに応じてコマンドを自動実行します。
- [CLI コマンドリファレンス](cli-reference.md) — 入門以外のコマンドを目的別に探します。
- [CLI の応答遅延と接続診断](../help/cli-diagnostics.md) — 応答の遅延、接続数、エラーコード別の対処。

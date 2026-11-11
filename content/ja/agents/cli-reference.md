<!-- source-hash: 1c0ea619cd71 -->
# CLI コマンドリファレンス

読み取り位置を指定する `read since-mark`、サーフェスの状態、メッセージキュー、共有メモリなど、入門で扱わないコマンドを目的別に説明します。すべての引数とオプションは `tasty help` で確認できます。

## コマンドを探す

```sh
tasty help                    # 目的別にまとめたコマンド一覧と最初のタスクの手順
tasty -a                      # すべてのコマンドパスと短い説明
tasty help read since-mark    # 1 つのコマンドの詳しい説明 (= tasty read since-mark --help)
```

`-h` は短い説明、`--help` と `tasty help <コマンド>` は詳しい説明を表示します。対象を選ぶオプションには、`--surface` · `--pane` · `--workspace` のように対象の種類の名前を使います。以前の表記（`--workspace-id`、`--target-surface` など）も別名として受け付け、ヘルプにも併記されます。

## 複数のエージェントが同じターミナルを読む場合: 位置を保持して読む

マークはサーフェスごとに 1 つしかないため、複数のエージェントが同じターミナルを見ると、あるエージェントの `set mark` がほかのエージェントの読み取り位置を動かします。互いに干渉しないようにするには、**次に読む位置をそれぞれ保存して**使います。

```sh
tasty read since-mark --surface 42 --strip-ansi --max-bytes 65536
# 応答の next_cursor と stream を覚えておき、次の呼び出しに渡します
tasty read since-mark --surface 42 --strip-ansi --cursor 81920 --stream 1a2b-7
```

- 応答（JSON）には `next_cursor`（次に読む位置）· `stream`（その位置を受け取ったターミナルの識別子）· `skipped`（その間にバッファから押し出されて消えたバイト数）が含まれます。**続きは必ず `next_cursor` から読んでください** — `text` の長さから計算すると、除去されたカラーコードの分だけずれます。
- Tasty は受信者ごとの読み取り位置を保存しません。それぞれが送った位置を使うため、ほかの受信者の位置や共用マークは変えません。
- `--cursor` は `--stream` と一緒にのみ使います。サーフェスが閉じられて同じ番号で開き直された場合や、ターミナルが起動し直された場合は、古い位置は適用されず、エラーで拒否されます — その場合は位置を指定せずに一度読み、新しく始めてください。
- `skipped` が 0 でなければ、その分が読み取る前に消えたということです。出力バッファには直近の 1 MiB だけが残ります。
- `--max-bytes` で一度に受け取る量を減らせます。残りは `next_cursor` から続けて読みます。`0` は「制限なし」ではなく、1 バイトとして扱われます — 制限なしで受け取るには `--max-bytes` を省いてください。
- この引数を認識しない旧バージョンの Tasty には**リクエストを送りません。**その場合、コマンドは stderr に `{"error":{"kind":"unsupported_capability",…,"sent":false}}` という 1 行を書き、終了コード 1 で終了します。何も送っていないため、Tasty を更新した後、そのまま呼び直せます。

<a id="サーフェスの中を見る"></a>

## サーフェスの状態確認

```sh
tasty surface cursor-position --surface 42     # カーソルが何行何列にあるか
tasty surface foreground-process --surface 42  # 現在フォアグラウンドで動くプログラム (is_shell が true ならシェルなのでアイドル)
tasty surface mouse-tracking --surface 42      # 内部のプログラムがマウスを捕捉したか、tasty がそれを尊重するか
tasty surface locate --surface 42              # このサーフェスが属するペインと、まだ存在するか
tasty surface respawn-terminal --surface 42    # 位置を保ったままシェルだけを起動し直す
tasty surface fire-hook --surface 42 --event process-exit    # フックを直接発火
tasty surface fire-hook --surface 42 --event idle-timeout:300 # 秒単位の値が付くイベントもあります
```

`respawn-terminal` は、新しいシェルが画面に表示された後も、以前のシェルの終了を確認してから応答します。
5 秒以内に終了を確認できなければ、新しいシェルはそのまま使えますが、応答は復旧が必要なエラー（`-32068`）になります。
このエラーを受け取った後、同じ冪等キー（IPC リクエストの `idempotency_key`）で再送すると、シェルの置き換えはすでに終わっているため、成功結果を受け取ります。
ターミナル・ワークスペース・タブを作るコマンドがシェルの起動中に失敗し、実際に何が実行されたかわからない場合は、待たずに復旧が必要なエラー（`-32068`）で応答します。同じ冪等キー（IPC リクエストの `idempotency_key`）で再送しても再実行せず、同じエラーを返します。
macOS・Linux で設定したシェルのファイルに実行権限がない場合や、パスにファイルがなく、代わりのシェルも見つからない場合など、シェルプロセスが作成される前に失敗すると、通常のエラーで応答します。Windows では、設定したシェルが Git Bash ではない場合、パスにファイルがない場合、または設定が空で既定のインストール先にも Git Bash が見つからない場合、ターミナルを作るコマンドは別のシェルで代替せず、シェルプロセスが作成される前に通常のエラーで失敗します。同じ冪等キーで再送すると同じ失敗を返し、シェルの設定を修正した後、新しい冪等キーで送ると再実行します。

## 子エージェントに権限を与える

```sh
tasty session issue --agent-id build-bot --permission surface.read --permission terminal.write
tasty session list
tasty session revoke --token <トークン>
```

発行されたトークンを子が `TASTY_SESSION_TOKEN` として使うと、Tasty に送るリクエストはそのトークンの権限で検査されます。
セッショントークンは、リクエストがどのエージェントのものかを区別し、エージェントのミスを防ぐ仕組みであり、セキュリティ境界ではありません。トークンなしで呼び出したコマンドは、ユーザーのコマンドとして処理されます。

リモート接続を準備する際は、セッショントークンで `tasty remote attach --into-gui`、`tasty remote connect`、`tasty remote disconnect`、`tasty remote refusals` を追加の権限なしで使えます。接続結果を一覧で確認する `tasty list workspaces` には `surface.read` 権限が必要です。コマンド形式と JSON の結果は、[リモート作業を続ける](../remote/attach.md)を参照してください。

プラグインが追加したコマンド（`tasty markdown recent` · `tasty codex spawn` など）にも権限が必要です。
`tasty <コマンド> …` なら `--permission ipc.invoke:<コマンド>` を指定してください — `tasty markdown …` は
`ipc.invoke:markdown` で、コマンド名に `-` がある場合は `_` に置き換えます。指定せずに呼び出すと拒否され、人に権限の承認リクエストが届きます。
`tasty claude spawn` で起動した Claude には、`tasty claude …` · `tasty codex …` の権限がすでに与えられています。

## 通知を送る

長いタスクが終わったときに人に知らせます。通知は通知パネルに蓄積され、サーフェスの枠・サイドバーのバッジで表示されます。OS の通知センターには送りません。

```sh
tasty notify "ビルド完了" --title "cargo"
tasty list notifications
```

詳しい通知動作と自動実行（フック）は、[フック · 通知 · Webhook](hooks-notifications.md)を参照してください。

## サーフェスにメモを残す（メタデータ）

サーフェスごとにキーと値を付けておけます。複数のエージェントが役割を示したり、状態をやり取りしたりする際に使います。

```sh
tasty surface-meta set --key role --value builder --surface 42
tasty surface-meta get --key role --surface 42
tasty surface-meta list --surface 42
tasty surface-meta unset --key role --surface 42
```

メモは開いているサーフェスにのみ付けられます。閉じたサーフェスの ID を指定するとエラーで拒否し、サーフェスを閉じるとそのサーフェスのメモも一緒に削除されます。

## サーフェス間でメッセージをやり取りする（キュー）

ターミナル入力に触れずに、サーフェス間でメッセージを渡すキューです。

```sh
tasty send queue --to 42 "テストが終わりました。結果を確認してください"
tasty list queue --surface 42            # 待機件数・プレビュー
tasty read queue --surface 42            # 蓄積されたメッセージをすべて取り出す
tasty read queue --surface 42 --peek     # 取り出さずに見る
tasty read queue --surface 42 --clear    # すべて空にする
```

<a id="子ターミナルをエージェントのように動かす"></a>

## 複数のターミナルにタスクを任せる

ワークスペースにターミナルを追加で開き、コマンドの実行、入力の送信、進行中のタスクの確認をしてください。Claude と Codex を含め、**通常のプログラムも**同じ方法で実行できます。Claude と Codex の[専用コマンド](claude-codex.md)は、セッション管理機能も提供します。

```sh
tasty terminal spawn --workspace build --command "cargo watch -x test" --cwd ~/proj --role worker
tasty terminal children                        # 自分の配下の子一覧
tasty terminal tell "y" --surface 57           # 子に入力を送る (改行を保持、自動送信)
tasty terminal broadcast $'git pull\r' --role worker # 同じ役割の子すべてに送る (末尾に実際の CR が必要)
tasty terminal kill --child 1                   # 子をインデックスで終了
```

`tasty terminal children` のデフォルト出力は、親 ID の表です。`--format table|json` を受け付け、デフォルトは `table` です。それ以外の値を指定するとエラーになります。スクリプトで JSON として読み取るには、`--format json` を追加してください。以前のバージョンでデフォルト出力を JSON として読み取っていたスクリプトにも、このオプションが必要です。

表は Markdown と同じようにパイプ（`|`）で列を区切り、列の順序は `id`、`parents`、`nickname`、`state`、`cwd`、`last_report_at`、`index`、`confidence`、`evidence` です。`id` は子サーフェスの ID、`index` は `kill --child` と `respawn --child` に渡す番号です。親が複数ある場合は、`parents` にカンマでつないで表示します。下の例のように `--parent-external` で指定した外部の親は、そのキーが `parents` に表示されます。`last_report_at` は `2026-11-09T12:19:12Z` のような形式で表示します。子がいない場合はヘッダーの 2 行だけを出力し、終了コードは 0 です。`tasty claude children` と `tasty codex children` も同じ列を出力します。

`spawn` はターミナルの準備が終わると応答し、エージェントのタスク終了は待ちません。エージェントの状態の伝達と親の受信準備は、[Claude・Codex 連携](claude-codex.md)に従います。通常のプログラムを作成しただけで、エージェントの結果の伝達が保証されるわけではありません。
待機するコマンドを別に動かす必要はありません。`--role` で役割を指定すると、`broadcast` でまとめて送れます。

子番号の予約を保存してから、新しいターミナルを準備します。予約の保存に失敗すると、ターミナルを作成したり command を送ったりせず、エラーで応答します。破損しているか読み取れない関係情報は上書きしません。

`adopt` は番号の割り当てと関係の登録をまとめて保存します。`adopt`・`release`・`set-state` は保存結果を確認してから応答します。保存結果を確定できなければ、成功と応答したり、同じ予約を自動で再実行したりしません。保存中に対象が閉じられたり変わったりすると、稼働中の対象への適用失敗を知らせます。`spawn --command` の入力も、子の関係が保存された後に送ります。

`terminal spawn` が準備段階で失敗すると、command を送らず、今回の呼び出しで作成したターミナルを片付けます。既存のターミナルは維持されます。

`--command` を指定した `spawn` は、新しいターミナルが画面に表示された後、command を入力して Enter を送り、それから応答します。その間に対象ターミナルが別のシェルに変わったり、リモートアタッチに占有されたりすると、Enter を送らず、復旧が必要なエラー（`-32068`）で応答し、作成したターミナルはそのまま残ります。command の入力と Enter の間にそのターミナルで直接打ったキーは、command の後ろに付いて一緒に実行される場合があります（`terminal tell` と同じです）。

子の親は通常、コマンドを実行したターミナルです。Claude・Codex 専用コマンドは親を自動で決めるため、別に指定する必要はありません。Tasty 外の対象（例: 別のプロセスで進行中のエージェントの会話）を親にするスクリプトなら、`--surface` の代わりに `--parent-external <キー>` を指定してください。キーは自分で決める文字列（空白なしで 256 バイト以下）で、同じキーを指定すると同じ親の配下にまとめられます。`spawn`・`children`・`kill`・`respawn`・`broadcast`・`release` がこのオプションを受け付けます。ウィンドウが複数開いている場合は、`--workspace` も一緒に指定してください。

```sh
tasty terminal spawn --workspace build --parent-external review-bot --command "make lint"
tasty terminal children --parent-external review-bot --workspace build
tasty terminal release --parent-external review-bot --workspace build --child 0
```

## 画面のない PTY

タブも画面も使わずに、プログラムを本物の PTY（仮想ターミナル）上で動かします。画面にタブを作らずに、
TTY が必要なコマンドをスクリプトから実行する際に使います。`spawn` が返す id で入力を送り、画面を読み取ります。

```sh
tasty pty spawn --cwd ~/proj -- python3         # コマンドを PTY で起動し、id を受け取る
tasty pty write --id 2147483648 $'print(1+1)\n' # 標準入力に送る (改行で送信)
tasty pty read --id 2147483648 --lines 20      # 現在の画面の最後の 20 行
tasty pty state --id 2147483648                 # 終了したかをすぐに確認 (待機しない)
tasty pty list                                  # 起動中の PTY 一覧
tasty pty kill --id 2147483648                   # 終了
```

実行状態の確認と、実行中のタスクをタブに移す方法は、[バックグラウンドタスクをタブに取り込む](background-tasks.md)にあります。

## エージェントが共有するメモリ

同じ Tasty 内の複数のエージェントが値をやり取りするキー・バリューストアです。範囲（グローバル · サーフェス · ワークスペース ·
ウィンドウ · アカウント）を選んで保存し、時間が経つと消えるようにしたり（TTL）、上書きを防いだり（CAS）できます。

```sh
tasty memory put --workspace 7 --key build.status --value running --ttl 600
tasty memory get --workspace 7 --key build.status
tasty memory list --workspace 7 --prefix build.
tasty memory delete --workspace 7 --key build.status
```

`--global` · `--surface 3` · `--window 42` · `--account me` で範囲を変えます。値が JSON なら
JSON として、それ以外は文字列として保存します。

`--ttl` を過ぎたキーは、存在しないキーと同じです。ほかのエージェントもそのキーに新しく保存でき、version は 1 から
再び始まります。期限切れの値は容量制限にも含まれず、Tasty が 10 分ごとにディスクから削除します。

`--surface` の範囲への保存は、開いているサーフェスにのみ可能です。閉じたサーフェスの ID を指定すると、エラーで拒否します。
`tasty memory import` も同様です。ファイルに閉じたサーフェスの範囲の項目が 1 つでもあると、何も取り込まずにエラーで拒否します。
サーフェスを閉じると、その範囲の値も一緒に削除されます。以前に閉じたサーフェスの範囲に残っている値は、
`tasty memory list --surface <ID>` で確認し、`tasty memory delete` で削除できます。

Tasty が起動時にメモリファイル（`~/.tasty/memory.db`）を開けない場合 — ファイルが破損しているか、権限が
ない場合 — Tasty は停止せず、**一時メモリ**で動作を続けます。その間に保存した値は、Tasty を
再起動すると消えます。メモリだけでなく、同じファイルに保存するエージェントのタスク・セマフォなどの
調整の仕組み、承認、サーフェスのメタデータ、テレメトリ、セッションも同様です。この状態では、それらの保存
結果に `"durable": false` が併記され、
`tasty list pressure` の `db_pragmas.memory_db` が `degraded: true` と原因（`init_failure`）を
示します。通知一覧にも、原因とこの影響を記した警告通知が 1 件残ります。

<a id="出力からシグナルを取り出す-オブザーバー"></a>

## 出力から必要な情報を集める（オブザーバー）

ターミナル出力から、パス・URL・終了コード・プロンプト境界などの項目を見つけて記録します。人が画面を見続けなくても、スクリプトからこの情報を使えます。

```sh
tasty output observe start --surface 42 --parsers exit_code,url --sink file
tasty output observe list                        # 現在動作中のオブザーバー一覧
tasty output observe info --observer 1           # 1 つの状態・収集数
tasty output observe stop --observer 1
```

`--sink memory` はメモリのリングバッファに、`--sink file` はファイルに集めます。`--parsers` を空にすると、既定の
パーサー（パス · URL · プロンプト境界 · 終了コード）がすべて有効になります。

<a id="エージェントの活動計測"></a>

## エージェントの使用量確認

複数のエージェントが自分の活動を数値で記録し（トークン数・呼び出し数など）、それを合計・時系列・上位
ランキングで確認します。複数のエージェントの使用量と活動をまとめて確認する際に便利です。

```sh
tasty telemetry record --metric tokens --value 1200 --tags '{"model":"opus"}'
tasty telemetry summary --metric tokens           # 合計・件数
tasty telemetry top --by agent --metric tokens    # エージェント別の上位
tasty telemetry timeseries --metric tokens --window 1h
```

`record` の `--agent` を省略すると、Tasty が確認した呼び出し元 ID で記録します。セッショントークンを使うエージェントは、そのセッションの ID を使います。トークンのないローカル呼び出しは、そのシェルの `TASTY_AGENT_ID` で記録し、値がないか、英字・数字・`_`・`-` からなる 64 文字以内の値でなければ、`_host` で記録します。この値は呼び出し元が自分で名乗った名前にすぎず、権限には影響しません。複数の値を順序も保って
一度に入れるには、`tasty telemetry record-batch` を使ってください。

## その他の照会・設定

エージェントが時々使うものです。全一覧は `tasty <コマンド> --help` で確認できます。

```sh
tasty list pressure                    # リクエストに応答する間のどこに時間がかかったか (読み方: 応答遅延と接続の診断)
tasty list theme                       # 現在適用されているテーマのスナップショット(色・文字サイズ・UI 倍率)
tasty list recent --kind markdown      # その種類で最近開いたファイルの一覧
tasty set cwd --surface 42 --path /tmp # リモートサーフェスが報告する作業ディレクトリを変更
tasty set url --surface 42 --url URL   # webview サーフェスのアドレスを変更(--label 名前: ページが隠れているときに表示する名前)
tasty surface html-script --surface 42 # HTML サーフェスのスクリプト・リモートコンテンツの検出・許可・案内の状態(照会のみ)
tasty surface html-script-allow --surface 42 --url <url> --fingerprint <hex>  # 照会した文書のスクリプトを許可して再読み込み。文書が変わっていれば拒否。フォーカスはそのまま
tasty surface html-remote-allow --surface 42 --url <url> --fingerprint <hex>  # 照会した文書にのみリモートコンテンツ(ネットワーク上のスタイルシート・画像・フォント・フレーム・スクリプト)を許可して再読み込み。スクリプトの許可とは別。フォーカスはそのまま
tasty surface html-nav --surface 42    # HTML サーフェスが表示する文書のアドレスと、戻る・進む操作が可能か(照会のみ)
tasty surface html-back --surface 42   # HTML サーフェスで戻る(html-forward: 進む、html-reload: 再読み込み)。フォーカスはそのままで、結果は html-nav で確認
tasty hook-handler dispatch --id user/my-handler  # フックハンドラを直接実行し、最終結果まで待つ
tasty hook-handler result --run 7       # dispatch が知らせた run 番号で結果を再確認
tasty file-handler dispatch ファイルパス     # エクスプローラーでダブルクリックしたときと同じ経路でファイルを開く(結果まで待つ)
tasty file-handler result --run 7       # dispatch が知らせた run 番号で結果を再確認
tasty file-handler reload               # ファイルハンドラの設定ファイルを再読み込み
tasty file-handler detectors            # ファイル形式の判別ルールが現在どう統合されているかを見る
```

`set cwd` と `set url` は、対象がそれぞれリモートサーフェス・webview サーフェスの場合にのみ動作します。通常のターミナルサーフェスに使うと、サポートされていない対象というエラーを返します。

`hook-handler dispatch` は 2 行を出力します。1 行目はリクエストを受け付けたという応答で、`run` 番号が含まれます。2 行目は待機後の最終結果です。結果の `state` が `succeeded` なら終了コード 0 で終了し、`partial`・`failed`・`unknown` の場合や、待機中に終わらなかった場合（`running`）は終了コード 1 で終了します。Tasty が結果の照会に応答しなくても、待機の上限で停止し、その場合は 2 行目に `"timed_out": true` が付きます。失敗した段階と理由は `result` と `steps` に表示されます。受け付ける前に拒否されたリクエスト（存在しないハンドラ、無効なハンドラ、キューが満杯など）は、1 行目なしでエラーを出し、終了コード 1 で終了します。`--no-wait` を付けると 1 行目だけを出力して終了コード 0 で終了するため、後で `hook-handler result --run <番号>` で結果を確認してください。結果を待つときはリクエストを複数回送るため、ルートオプション `--response-timeout-ms` は受け付けません。付けると何も送らず、使用方法のエラー（終了コード 2）で終了します。`--no-wait` を付けるとリクエストは 1 つだけなので、このオプションがそのリクエストに適用されます。シェルに設定されたセッショントークン（`TASTY_SESSION_TOKEN`）とエージェント ID（`TASTY_AGENT_ID`）は、結果を問い合わせるリクエストにもそのまま含まれます。

`file-handler dispatch` はファイルパスのみ受け付けます。`https://…` のような Web アドレスを渡すとエラーを返します。このコマンドで開いたファイルは新しいタブとして後ろに追加されるだけで、ユーザーが見ていたタブは変わりません。この形式を開くハンドラがなければ、ユーザーの画面に**次で開く…** <!-- en: Open file with… --> を表示せず、ファイルを開きません。コマンドは `hook-handler dispatch` と同様に 2 行を出力します。1 行目はリクエストを受け付けたという応答（`run` 番号を含む）で、2 行目は最終結果です。開いた場合は `state` が `succeeded` で、新しいタブは `surface_id` で知らせ、終了コード 0 で終了します。開くハンドラがないか、ハンドラが失敗すると、`state` が `failed` で `result` に理由が表示され、終了コード 1 で終了します。リモートワークスペースのタブを基準に開く場合は、リモートの Tasty が実際に開いたかどうかまで待ちます。リモートが開けなければ、`failed` とリモートが知らせた理由が表示されます。リモートの応答を受け取る前に接続が切れると、開いたかどうかわからないため、`state` が `unknown` になり、終了コードは 1 です。30 秒以内に結果を受け取れない場合も終了コードは 1 です。`--no-wait` を付けると 1 行目だけを出力し、後で `file-handler result --run <番号>` で結果を確認します。結果を待つときはルートオプション `--response-timeout-ms` を受け付けません（終了コード 2）。GUI なしでサーバー上で実行するヘッドレスビルドはファイルを開けないため、このコマンドにリクエストを受け付けたとは応答せず、このビルドではサポートされていないというエラーを返します。

`file-handler reload` の応答には `rejected` 一覧があります。設定ファイルで現在適用されていない項目の `id` と理由（`reason`）が含まれ、すべて適用されていれば空の一覧です。理由は 3 つあります。

- `missing_owner_prefix` — `id` の前に `user/` のような所有者部分が付いていません（`user/名前` と記述する必要があります）。この項目は破棄されます。
- `missing_detector_or_action` — 自分で作成した `user/…` 項目で、どのファイルを扱うか（`detector`）または何をするか（`action`）が空です。この項目は破棄されます。
- `target_not_contributed` — 既定のハンドラやプラグインハンドラを変更する項目ですが、その対象が現在存在しません。プラグインが無効か、`id` が間違っている場合です。項目は残り、プラグインが有効になるとそのまま適用されます。有効にした後も残っている場合は、`id` を確認してください。

`file-handler detectors` は、ファイル形式の判別ルール（detector）ごとに、現在適用されている値（表示名・アイコン・有効かどうか・ルール）と、その値の元になった提供元別の原本（`contributions`）を一緒に表示します。提供元は `host`（組み込み）· `plugin:<id>` · `user`（設定ファイル）です。設定ファイルに書いた値が実際に適用されたか確認する際に使います — `contributions` はインストールされた順に並ぶため、どの値が適用されたかは、上にある適用値を見てください。

`list info` のワークスペース数とアクティブ位置は、照会したウィンドウの値であり、一緒に返されるワークスペース ID で所属を確認できます。すべてのワークスペースは `list workspaces`、各ウィンドウの状態は `list windows` で確認してください。

## あわせて読む

- [tasty CLI でターミナルを操作する](cli.md) — 初めて使うときの手順と基本パターン。
- [CLI の応答遅延と接続の診断](../help/cli-diagnostics.md) — `tasty list pressure` の読み方とエラーコード別の対処。
- [バックグラウンドタスクをタブに取り込む](background-tasks.md) · [Claude・Codex と一緒に使う](claude-codex.md) · [タスクの順序管理](tasks.md) · [フック · 通知 · Webhook](hooks-notifications.md)

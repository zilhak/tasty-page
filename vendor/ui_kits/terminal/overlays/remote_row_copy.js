// Copy for the saved remote workspace row, its connection popup, its menu, the close-on-remote
// confirmation, the reconnect setting and the chain-disabled attach row. Values for tasty lang/*.toml.
// Written by Codex in four languages and checked by script (placeholders, line breaks, script mixing,
// glossary avoid terms). status_bar.remote_reconnecting and attach.mirror_workspace are reused as they are.
// child_graph.reconnect and child_graph.reconnecting are reused from graph_copy.js.
import { GRAPH_COPY } from "./graph_copy.js";

export const REMOTE_ROW_COPY = {
  "remote.row.state.connecting": {"en": "connecting", "ko": "연결 중", "ja": "接続中", "zh-Hans": "连接中"},
  "remote.row.state.not_connected": {"en": "not connected", "ko": "미연결", "ja": "未接続", "zh-Hans": "未连接"},
  "status_bar.remote_disconnected": {"en": "disconnected", "ko": "연결 끊김", "ja": "切断済み", "zh-Hans": "已断开"},
  "remote.row.popup.profile": {"en": "Profile", "ko": "프로필", "ja": "プロファイル", "zh-Hans": "配置档"},
  "remote.row.popup.remote_workspace": {"en": "Remote workspace", "ko": "원격 워크스페이스", "ja": "リモートワークスペース", "zh-Hans": "远程工作区"},
  "remote.row.popup.connect": {"en": "Connect", "ko": "연결", "ja": "接続する", "zh-Hans": "连接"},
  "remote.row.popup.connecting": {"en": "Connecting…", "ko": "연결 중…", "ja": "接続中…", "zh-Hans": "正在连接…"},
  "remote.row.popup.lost_title": {"en": "Connection lost", "ko": "연결 두절", "ja": "接続が途切れました", "zh-Hans": "连接中断"},
  "remote.row.popup.lost_body": {"en": "Tasty will keep trying to reconnect for up to {} s.", "ko": "Tasty가 최대 {} s 동안 재연결을 시도합니다.", "ja": "Tasty は最大 {} s の間、再接続を試みます。", "zh-Hans": "Tasty 将持续尝试重新连接，最长 {} s。"},
  "remote.row.popup.gave_up_title": {"en": "Reconnection timed out", "ko": "재연결 시간 초과", "ja": "再接続がタイムアウト", "zh-Hans": "重新连接超时"},
  "remote.row.popup.gave_up_body": {"en": "Stopped trying to reconnect after {} s.", "ko": "{} s 동안 시도한 뒤 재연결을 중단했습니다.", "ja": "{} s 試行した後、再接続を中止しました。", "zh-Hans": "尝试 {} s 后已停止重新连接。"},
  "remote.row.popup.user_title": {"en": "Disconnected", "ko": "연결 종료", "ja": "切断済み", "zh-Hans": "连接已断开"},
  "remote.row.popup.user_body_stay": {"en": "You disconnected this workspace. It stays disconnected until you reconnect.", "ko": "직접 연결을 끊은 워크스페이스입니다. 재연결할 때까지 연결이 끊긴 상태로 유지됩니다.", "ja": "手動で切断したワークスペースです。再接続するまで切断状態が続きます。", "zh-Hans": "已手动断开此工作区。重新连接前将保持断开。"},
  "remote.row.popup.user_body_next": {"en": "You disconnected this workspace. It will reconnect the next time you open it.", "ko": "직접 연결을 끊은 워크스페이스입니다. 다음에 열면 재연결합니다.", "ja": "手動で切断したワークスペースです。次に開くと再接続します。", "zh-Hans": "已手动断开此工作区。下次打开时将重新连接。"},
  "remote.row.popup.idle_title": {"en": "Not connected", "ko": "미연결", "ja": "未接続", "zh-Hans": "未连接"},
  "remote.row.popup.failed_title": {"en": "Connection failed", "ko": "연결 실패", "ja": "接続失敗", "zh-Hans": "连接失败"},
  "remote.row.reason.profile_missing": {"en": "Profile {} no longer exists. It may have been renamed or deleted.", "ko": "{} 프로필이 더 이상 존재하지 않습니다. 이름이 변경되었거나 삭제되었을 수 있습니다.", "ja": "プロファイル {} はもう存在しません。名前が変更されたか、削除された可能性があります。", "zh-Hans": "配置档 {} 已不存在。可能已重命名或删除。"},
  "remote.row.reason.workspace_missing": {"en": "Workspace {} no longer exists on the remote Tasty.", "ko": "원격 Tasty에 {} 워크스페이스가 더 이상 존재하지 않습니다.", "ja": "リモートの Tasty にワークスペース {} はもう存在しません。", "zh-Hans": "远程 Tasty 上的工作区 {} 已不存在。"},
  "remote.row.reason.occupied": {"en": "Another client holds workspace {}. It cannot be taken over from here.", "ko": "다른 클라이언트가 {} 워크스페이스에 연결되어 있습니다. 여기서는 연결을 가져올 수 없습니다.", "ja": "別のクライアントがワークスペース {} に接続中です。ここから接続を引き継ぐことはできません。", "zh-Hans": "其他客户端已占用工作区 {}。无法从此处接管。"},
  "remote.row.reason.chain": {"en": "Workspace {} is a mirror from another machine. A mirror cannot be mirrored again.", "ko": "{} 워크스페이스는 다른 컴퓨터의 미러입니다. 미러는 다시 미러링할 수 없습니다.", "ja": "ワークスペース {} は別のマシンのミラーです。ミラーをさらにミラーリングすることはできません。", "zh-Hans": "工作区 {} 是另一台计算机上工作区的镜像。无法再次镜像。"},
  "remote.row.reason.endpoint": {"en": "Could not prepare the local tunnel endpoint for profile {}.", "ko": "{} 프로필의 로컬 터널 엔드포인트를 준비하지 못했습니다.", "ja": "プロファイル {} のローカルトンネルエンドポイントを準備できませんでした。", "zh-Hans": "无法为配置档 {} 准备本地隧道端点。"},
  "remote.row.reason.self": {"en": "Profile {} points at this Tasty, so it was not connected.", "ko": "{} 프로필은 지금 실행 중인 Tasty를 가리키므로 연결하지 않았습니다.", "ja": "プロファイル {} は実行中の Tasty 自身を指しているため、接続しませんでした。", "zh-Hans": "配置档 {} 指向当前 Tasty，因此未连接。"},
  "remote.row.menu.disconnect": {"en": "Disconnect", "ko": "연결 끊기", "ja": "接続を切る", "zh-Hans": "断开连接"},
  "remote.row.menu.close_local": {"en": "Close locally", "ko": "로컬에서 닫기", "ja": "ローカルで閉じる", "zh-Hans": "在本地关闭"},
  "remote.row.menu.close_remote": {"en": "Close remote workspace…", "ko": "원격 워크스페이스 닫기…", "ja": "リモートワークスペースを閉じる…", "zh-Hans": "关闭远程工作区…"},
  "remote.row.close_remote.title": {"en": "Close remote workspace {}?", "ko": "원격 워크스페이스 {}을(를) 닫으시겠습니까?", "ja": "リモートワークスペース {} を閉じますか？", "zh-Hans": "关闭远程工作区 {}？"},
  "remote.row.close_remote.body": {"en": "The workspace and all its processes will end on the remote Tasty for profile {}. This cannot be undone.", "ko": "{} 프로필의 원격 Tasty에서 워크스페이스와 그 안의 모든 프로세스를 종료합니다. 되돌릴 수 없습니다.", "ja": "プロファイル {} のリモート Tasty で、ワークスペースとその中の全プロセスを終了します。取り消せません。", "zh-Hans": "将终止配置档 {} 对应的远程 Tasty 上的工作区及其中的所有进程。此操作无法撤销。"},
  "remote.row.close_remote.last": {"en": "Closing the last tab also closes the workspace on the remote Tasty.", "ko": "마지막 탭을 닫으면 원격 Tasty의 워크스페이스도 닫힙니다.", "ja": "最後のタブを閉じると、リモートの Tasty でもワークスペースが閉じます。", "zh-Hans": "关闭最后一个标签页也会关闭远程 Tasty 上的工作区。"},
  "remote.row.close_remote.confirm": {"en": "Close remote workspace", "ko": "원격 워크스페이스 닫기", "ja": "リモートワークスペースを閉じる", "zh-Hans": "关闭远程工作区"},
  "settings.remote_attach.reconnect_window": {"en": "Keep reconnecting for", "ko": "재연결 시도 시간", "ja": "再接続の試行時間", "zh-Hans": "重新连接尝试时长"},
  "settings.remote_attach.reconnect_window_desc": {"en": "How long to keep trying to reconnect, starting when Disconnect after ends the connection. 0 disables automatic reconnecting. This automatic retry does not apply to connections you end yourself. Default 300.", "ko": "‘끊기 전 대기 시간’이 지나 연결이 끊긴 시점부터 재연결을 시도하는 시간입니다. 0이면 자동 재연결을 끕니다. 직접 끊은 연결에는 이 자동 재시도를 적용하지 않습니다. 기본값 300.", "ja": "「切断までの待機時間」が過ぎて接続が切れた時点から、再接続を試みる時間です。0 で自動再接続を無効にします。この自動再試行は、手動で切断した接続には適用されません。既定値 300。", "zh-Hans": "从“断开前等待时长”到期导致连接断开时起，持续尝试重新连接的时长。0 禁用自动重新连接。此自动重试不适用于手动断开的连接。默认值 300。"},
  "remote_attach.chain_badge": {"en": "mirror", "ko": "미러", "ja": "ミラー", "zh-Hans": "镜像"},
  "status_bar.remote_reconnecting": {"en": "reconnecting", "ko": "재연결 중", "ja": "再接続中", "zh-Hans": "重新连接中"},
  "attach.mirror_workspace": {"en": "Mirror of a remote workspace", "ko": "원격 워크스페이스의 미러 화면", "ja": "リモートワークスペースのミラー", "zh-Hans": "远程工作区的镜像"},
  "child_graph.reconnect": GRAPH_COPY["child_graph.reconnect"],
  "child_graph.reconnecting": GRAPH_COPY["child_graph.reconnecting"],
};

// rt(key, lang, ...args): the value with each {} filled in order.
export function rt(key, lang = "en", ...args) {
  const e = REMOTE_ROW_COPY[key];
  let s = (e && (e[lang] || e.en)) || key;
  for (const a of args) s = s.replace("{}", a);
  return s;
}

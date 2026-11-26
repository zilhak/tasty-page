// Tasty UI kit — copy for the Linux display-backend notices (2026-11-11): what is off, why, and how to fix it,
// when Tasty runs on native Wayland (no XWayland, or the X server in DISPLAY unreachable) or was started with a
// GDK_BACKEND value that does not allow x11 (cause 2: wayland, broadway or any other value without x11, so its title
// names no value), and what is off when GTK failed to initialize for any other reason (gtk-init: the window is
// X11, GDK_BACKEND is unset or allows x11; Tasty does not know why GTK failed). Values for tasty lang/*.toml. Written by Codex (en, ko, ja, zh-Hans; zh-Hans follows
// i18n/zh-Hans/glossary.json) and checked by script: no placeholders, no line breaks, no Hangul or kana in the
// wrong language, no glossary avoid term, every toast at most 200 characters in every language.
// Send changes back to Codex rather than editing a value by hand.
//
// Menus are not on this list: where the native menu cannot open, Tasty draws its own fallback menu instead, so no
// menu notice exists. Toast life is the global setting for every toast here; none has a life of its own.
// Every toast holds the cause and the fix. A webview notice holds the cause in its title and the fix in its _sub,
// except webview.gtk_init_failed: there is no fix the user can take, so it has no _sub key and its sub line stays
// empty. gtk-init raises no toast (the window is X11, so the clipboard works) and names neither menus nor file drops.
// No notice here has a button or a link (decided 2026-11-11), so none opens the user guide.
// toast.clipboard_wayland_unsupported is an existing key with a new value. The rest are new keys.
// toast.clipboard_files_internal_copy / _paste are unchanged and stay for system clipboard failures on X11.
//
// Native Wayland clipboard scope (2026-11-12): Tasty now owns the Wayland clipboard itself, so on native Wayland
// (cause 1 and 1b) ordinary terminal copy and paste, text and images, reach other apps and raise none of these
// Wayland warning toasts (the usual copy success toasts such as toast.copied stay). What is still off, each with its
// own keys, always split by cause 1 / 1b:
//   (a) a copy mode yank into the "* register: toast.clipboard_primary_wayland_unsupported / _x_failed. The value
//       names only "*, says "+ works, and never says copy or paste with other apps is off as a whole.
//   (b) Explorer file copy, cut and paste: toast.clipboard_files_wayland_* (values for _paste narrowed to files
//       copied in other apps; _copy unchanged).
//   (c) the desktop gives Tasty no clipboard on native Wayland, so nothing reaches other apps:
//       toast.clipboard_wayland_unsupported / _x_failed, values unchanged. When (c) holds it wins over (a), since
//       "+ does not work there either.
// Turning on XWayland, or fixing the X server or XWayland connection, and restarting Tasty fixes all three
// (by the code path: Tasty then takes the X11 clipboard; not measured by running).
// GDK_BACKEND, X11, XWayland, Wayland, DISPLAY, GTK and Tasty are never translated.

export const DB_LANGS = ["en", "ko", "ja", "zh-Hans"];

export const DISPLAY_BACKEND_COPY = {
  "webview.native_wayland": {"en": "This view can't be shown: no XWayland, so Tasty runs on native Wayland.", "ko": "XWayland가 없어 Tasty가 네이티브 Wayland로 실행되므로 이 뷰를 표시할 수 없습니다.", "ja": "XWaylandがなく、TastyがネイティブWaylandで動作しているため、このビューを表示できません。", "zh-Hans": "XWayland 不可用，Tasty 以原生 Wayland 运行，无法显示此视图。"},
  "webview.native_wayland_sub": {"en": "Turn on XWayland outside Tasty, then restart Tasty.", "ko": "Tasty 외부에서 XWayland를 켠 뒤 Tasty를 재시작하세요.", "ja": "Tastyの外部でXWaylandを有効にしてから、Tastyを再起動してください。", "zh-Hans": "请在 Tasty 外部启用 XWayland 后重启 Tasty。"},
  "webview.native_wayland_x_failed": {"en": "This view can't be shown: Tasty can't reach the X server in DISPLAY and runs on native Wayland.", "ko": "DISPLAY의 X 서버에 연결할 수 없어 Tasty가 네이티브 Wayland로 실행되므로 이 뷰를 표시할 수 없습니다.", "ja": "DISPLAYのXサーバーに接続できず、TastyがネイティブWaylandで動作しているため、このビューを表示できません。", "zh-Hans": "无法连接 DISPLAY 指定的 X 服务器，Tasty 以原生 Wayland 运行，无法显示此视图。"},
  "webview.native_wayland_x_failed_sub": {"en": "Check the X server or XWayland connection, then restart Tasty.", "ko": "X 서버 또는 XWayland 연결을 확인한 뒤 Tasty를 재시작하세요.", "ja": "XサーバーまたはXWaylandの接続を確認してから、Tastyを再起動してください。", "zh-Hans": "请检查 X 服务器或 XWayland 连接后重启 Tasty。"},
  "webview.gdk_backend": {"en": "GDK_BACKEND in Tasty's launch environment blocks X11, so this view and the tray icon are off.", "ko": "Tasty 시작 환경의 GDK_BACKEND 설정이 X11 사용을 막아 이 뷰와 트레이 아이콘을 사용할 수 없습니다.", "ja": "Tastyの起動環境のGDK_BACKEND設定でX11が使えないため、このビューとトレイアイコンは使えません。", "zh-Hans": "Tasty 启动环境中的 GDK_BACKEND 设置不允许使用 X11，此视图和托盘图标不可用。"},
  "webview.gdk_backend_sub": {"en": "Remove GDK_BACKEND from Tasty's launch environment, then restart Tasty.", "ko": "Tasty 시작 환경에서 GDK_BACKEND를 제거한 뒤 Tasty를 재시작하세요.", "ja": "Tastyの起動環境からGDK_BACKENDを削除してから、Tastyを再起動してください。", "zh-Hans": "请从 Tasty 启动环境中移除 GDK_BACKEND 后重启 Tasty。"},
  "webview.gtk_init_failed": {"en": "GTK failed to initialize, so this view and the tray icon are off.", "ko": "GTK 초기화에 실패하여 이 뷰와 트레이 아이콘을 사용할 수 없습니다.", "ja": "GTKの初期化に失敗したため、このビューとトレイアイコンは使えません。", "zh-Hans": "GTK 初始化失败，此视图和托盘图标不可用。"},
  "toast.clipboard_wayland_unsupported": {"en": "Can't copy or paste with other apps: no XWayland, so Tasty runs on native Wayland. Turn on XWayland outside Tasty, then restart Tasty.", "ko": "XWayland가 없어 Tasty가 네이티브 Wayland로 실행되므로 다른 앱과 복사·붙여넣기를 할 수 없습니다. Tasty 외부에서 XWayland를 켠 뒤 Tasty를 재시작하세요.", "ja": "XWaylandがなく、TastyがネイティブWaylandで動作しているため、他のアプリとのコピーと貼り付けはできません。Tastyの外部でXWaylandを有効にしてから、Tastyを再起動してください。", "zh-Hans": "XWayland 不可用，Tasty 以原生 Wayland 运行，无法与其他应用之间复制粘贴。请在 Tasty 外部启用 XWayland 后重启 Tasty。"},
  "toast.clipboard_wayland_x_failed": {"en": "Can't copy or paste with other apps: Tasty can't reach the X server in DISPLAY and runs on native Wayland. Check the X server or XWayland connection, then restart Tasty.", "ko": "DISPLAY의 X 서버에 연결할 수 없어 Tasty가 네이티브 Wayland로 실행되므로 다른 앱과 복사·붙여넣기를 할 수 없습니다. X 서버 또는 XWayland 연결을 확인한 뒤 Tasty를 재시작하세요.", "ja": "DISPLAYのXサーバーに接続できず、TastyがネイティブWaylandで動作しているため、他のアプリとのコピーと貼り付けはできません。XサーバーまたはXWaylandの接続を確認してから、Tastyを再起動してください。", "zh-Hans": "无法连接 DISPLAY 指定的 X 服务器，Tasty 以原生 Wayland 运行，无法与其他应用之间复制粘贴。请检查 X 服务器或 XWayland 连接后重启 Tasty。"},
  "toast.clipboard_primary_wayland_unsupported": {"en": "Copying with \"* doesn't reach other apps: no XWayland, so Tasty runs on native Wayland. Copy with \"+ instead, or turn on XWayland outside Tasty, then restart Tasty.", "ko": "XWayland가 없어 Tasty가 네이티브 Wayland로 실행되므로 \"*로 복사한 내용은 다른 앱에 전달되지 않습니다. \"+로 복사하거나 Tasty 외부에서 XWayland를 켠 뒤 Tasty를 재시작하세요.", "ja": "XWaylandがなく、TastyがネイティブWaylandで動作しているため、\"*でコピーしたテキストは他のアプリに渡りません。\"+でコピーするか、Tastyの外部でXWaylandを有効にしてから、Tastyを再起動してください。", "zh-Hans": "XWayland 不可用，Tasty 以原生 Wayland 运行，用 \"* 复制的文本无法传递到其他应用。请改用 \"+ 复制，或在 Tasty 外部启用 XWayland 后重启 Tasty。"},
  "toast.clipboard_primary_wayland_x_failed": {"en": "Copying with \"* doesn't reach other apps: Tasty can't reach the X server in DISPLAY and runs on native Wayland. Copy with \"+ instead, or check the X server or XWayland connection, then restart Tasty.", "ko": "DISPLAY의 X 서버에 연결할 수 없어 Tasty가 네이티브 Wayland로 실행되므로 \"*로 복사한 내용은 다른 앱에 전달되지 않습니다. \"+로 복사하거나 X 서버 또는 XWayland 연결을 확인한 뒤 Tasty를 재시작하세요.", "ja": "DISPLAYのXサーバーに接続できず、TastyがネイティブWaylandで動作しているため、\"*でコピーしたテキストは他のアプリに渡りません。\"+でコピーするか、XサーバーまたはXWaylandの接続を確認してから、Tastyを再起動してください。", "zh-Hans": "无法连接 DISPLAY 指定的 X 服务器，Tasty 以原生 Wayland 运行，用 \"* 复制的文本无法传递到其他应用。请改用 \"+ 复制，或检查 X 服务器或 XWayland 连接后重启 Tasty。"},
  "toast.clipboard_files_wayland_copy": {"en": "Files stay in this Tasty and can only be pasted here: no XWayland, so Tasty runs on native Wayland. Turn on XWayland outside Tasty, then restart Tasty.", "ko": "XWayland가 없어 Tasty가 네이티브 Wayland로 실행되므로 파일은 이 Tasty에만 저장되며 여기에서만 붙여넣을 수 있습니다. Tasty 외부에서 XWayland를 켠 뒤 Tasty를 재시작하세요.", "ja": "XWaylandがなく、TastyがネイティブWaylandで動作しているため、ファイルはこのTasty内にのみ保存され、ここでのみ貼り付けできます。Tastyの外部でXWaylandを有効にしてから、Tastyを再起動してください。", "zh-Hans": "XWayland 不可用，Tasty 以原生 Wayland 运行，文件仅保存在此 Tasty 中，只能在此粘贴。请在 Tasty 外部启用 XWayland 后重启 Tasty。"},
  "toast.clipboard_files_wayland_paste": {"en": "Can't read files copied in other apps. Pasting files kept here. No XWayland, so Tasty runs on native Wayland. Turn on XWayland outside Tasty, then restart Tasty.", "ko": "XWayland가 없어 Tasty가 네이티브 Wayland로 실행되므로 다른 앱에서 복사한 파일을 읽을 수 없어 이 Tasty에 저장된 파일을 붙여넣습니다. Tasty 외부에서 XWayland를 켠 뒤 Tasty를 재시작하세요.", "ja": "XWaylandがなく、TastyがネイティブWaylandで動作しているため、他のアプリでコピーしたファイルを読み取れず、このTasty内に保存されたファイルを貼り付けます。Tastyの外部でXWaylandを有効にしてから、Tastyを再起動してください。", "zh-Hans": "XWayland 不可用，Tasty 以原生 Wayland 运行，无法读取其他应用复制的文件，正在粘贴此 Tasty 中保存的文件。请在 Tasty 外部启用 XWayland 后重启 Tasty。"},
  "toast.clipboard_files_wayland_x_failed_copy": {"en": "Files stay in this Tasty and can only be pasted here: Tasty can't reach the X server in DISPLAY and runs on native Wayland. Check the X server or XWayland connection, then restart Tasty.", "ko": "DISPLAY의 X 서버에 연결할 수 없어 Tasty가 네이티브 Wayland로 실행되므로 파일은 이 Tasty에만 저장되며 여기에서만 붙여넣을 수 있습니다. X 서버 또는 XWayland 연결을 확인한 뒤 Tasty를 재시작하세요.", "ja": "DISPLAYのXサーバーに接続できず、TastyがネイティブWaylandで動作しているため、ファイルはこのTasty内にのみ保存され、ここでのみ貼り付けできます。XサーバーまたはXWaylandの接続を確認してから、Tastyを再起動してください。", "zh-Hans": "无法连接 DISPLAY 指定的 X 服务器，Tasty 以原生 Wayland 运行，文件仅保存在此 Tasty 中，只能在此粘贴。请检查 X 服务器或 XWayland 连接后重启 Tasty。"},
  "toast.clipboard_files_wayland_x_failed_paste": {"en": "Can't read files copied in other apps. Pasting files kept here. Tasty can't reach the X server in DISPLAY and runs on native Wayland. Check the X server or XWayland connection, then restart Tasty.", "ko": "DISPLAY의 X 서버에 연결할 수 없어 Tasty가 네이티브 Wayland로 실행되므로 다른 앱에서 복사한 파일을 읽을 수 없어 이 Tasty에 저장된 파일을 붙여넣습니다. X 서버 또는 XWayland 연결을 확인한 뒤 Tasty를 재시작하세요.", "ja": "DISPLAYのXサーバーに接続できず、TastyがネイティブWaylandで動作しているため、他のアプリでコピーしたファイルを読み取れず、このTasty内に保存されたファイルを貼り付けます。XサーバーまたはXWaylandの接続を確認してから、Tastyを再起動してください。", "zh-Hans": "无法连接 DISPLAY 指定的 X 服务器，Tasty 以原生 Wayland 运行，无法读取其他应用复制的文件，正在粘贴此 Tasty 中保存的文件。请检查 X 服务器或 XWayland 连接后重启 Tasty。"},
};

// File drops from other apps (J2, decided 2026-11-11): Tasty takes them on native Wayland too, so no notice here
// names them. The values above are final; there is no second branch.

// dbt(key, lang): the value for key in lang.
export function dbt(key, lang = "en") {
  const e = DISPLAY_BACKEND_COPY[key];
  return (e && (e[lang] || e.en)) || key;
}

// dbHas(key): whether the table holds key (a notice without a fix has no _sub key).
export function dbHas(key) {
  return Object.prototype.hasOwnProperty.call(DISPLAY_BACKEND_COPY, key);
}

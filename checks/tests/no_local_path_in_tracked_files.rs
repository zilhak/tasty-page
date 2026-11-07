//! 이 레포의 추적 파일에 로컬 경로와 로컬 작업 문서의 인용이 없는지 확인한다.
//! 공개 레포라 실제 사용자 홈 경로, 로컬 작업 폴더, 로컬 지침 폴더를 적지 않는다.
//! 가이드·갤러리의 가상 예시 경로는 이유와 함께 허용 목록에 둔다. 규칙을 설명하는 문장처럼
//! 로컬 폴더 이름을 적어야 하는 자리는 파일·문구·횟수를 등록해 새 문구가 자동 면제되지 않게 한다.
//! 추적 파일 목록은 git ls-files로 얻는다. UTF-8 텍스트가 아닌 파일은 건너뛴다.
//! 이 레포의 checks.yml에서 실행된다.

use std::path::Path;
use tasty_doc_guards::temp_scratch::Scratch;

/// 로컬 작업 폴더 이름. 이 파일 자신이 그 이름을 담지 않도록 나눠 적는다.
const LOCAL_WORKSPACE: &str = concat!(".cla", "ude-workspace");

/// 로컬 지침 폴더 경로의 시작. `~/` 아래의 Claude Code 설정 폴더는 사용자 안내라 허용한다.
const LOCAL_GUIDE_DIR: &str = concat!(".cla", "ude/");

/// 사용자 홈 아래라 Claude Code 사용자 설정을 가리키는 접두사.
const USER_CONFIG_PREFIXES: &[&str] = &["~/", "$HOME/"];

/// 홈 경로 접두사. 바로 뒤의 이름이 사용자 이름이다.
const HOME_PREFIXES: &[&str] = &["/home/", "/Users/", "C:\\Users\\"];

/// 실제 사용자가 아닌 예시 홈 경로와 그 이유.
const FICTIONAL_HOMES: &[(&str, &str)] = &[
    (
        "/home/me",
        "원격 attach 가이드가 원격 호스트의 예시 경로로 쓴다",
    ),
    (
        "/home/tasty",
        "갤러리와 UI 키트의 플러그인 경로 예시다",
    ),
    (
        "/home/deploy",
        "갤러리의 원격 마크다운 주소창과 오버레이 예시 경로다",
    ),
    ("/Users/me", "UI 키트의 HTML 스크립트 배너 예시 경로다"),
    ("/Users/hana", "갤러리 로딩 화면의 예시 경로다"),
    (
        "/Users/hyunjun",
        "갤러리 오버레이의 긴 키 파일 경로 예시다",
    ),
    (
        "/Users/hyunjoon.kim",
        "갤러리 알림 열의 긴 경로 말줄임 예시다",
    ),
];

/// 로컬 폴더 이름을 적어야 하는 자리. 파일 안에서 정확히 `count`번 나와야 한다.
struct Mention {
    path: &'static str,
    phrase: &'static str,
    count: usize,
    why: &'static str,
}

const ALLOWED_MENTIONS: &[Mention] = &[
    Mention {
        path: ".gitignore",
        phrase: concat!(".cla", "ude-workspace"),
        count: 1,
        why: "로컬 작업 폴더를 추적하지 않게 하는 무시 규칙이다",
    },
    Mention {
        path: "CLAUDE.md",
        phrase: concat!("`.cla", "ude`와 `.cla", "ude-workspace`는 git에 넣지 않는다"),
        count: 1,
        why: "로컬 폴더를 커밋하지 않는다는 레포 규칙 문장이다",
    },
];

/// 2026-11-07 측정 추적 파일 431개 중 UTF-8 텍스트 412개. 수집 누락을 찾는 보조 하한이다.
const MIN_TEXT_FILES: usize = 300;

/// 홈 접두사 뒤의 사용자 이름까지 포함한 경로를 모두 찾는다. 이름이 비면 경로 설명이라 건너뛴다.
fn home_paths(line: &str) -> Vec<String> {
    let mut out = Vec::new();
    for prefix in HOME_PREFIXES {
        for (at, _) in line.match_indices(prefix) {
            let rest = &line[at + prefix.len()..];
            let name: String = rest
                .chars()
                .take_while(|c| c.is_ascii_alphanumeric() || "._-".contains(*c))
                .collect();
            if name.is_empty() {
                continue;
            }
            let path = format!("{prefix}{name}");
            if !FICTIONAL_HOMES.iter().any(|(p, _)| *p == path) {
                out.push(path);
            }
        }
    }
    out
}

/// `~/` 아래가 아닌 로컬 지침 폴더 경로의 수.
fn local_guide_dir_hits(text: &str) -> usize {
    text.match_indices(LOCAL_GUIDE_DIR)
        .filter(|(at, _)| {
            !USER_CONFIG_PREFIXES
                .iter()
                .any(|p| text[..*at].ends_with(p))
        })
        .count()
}

/// 파일 하나의 위반. 등록한 문구 안의 로컬 작업 폴더 이름은 빼고 센다.
fn violations(rel: &str, text: &str, mentions: &[Mention]) -> Vec<String> {
    let mut out = Vec::new();
    for (i, line) in text.lines().enumerate() {
        for p in home_paths(line) {
            out.push(format!("  {rel}:{} — 홈 경로 {p}", i + 1));
        }
    }
    let found = text.matches(LOCAL_WORKSPACE).count();
    let registered: usize = mentions
        .iter()
        .filter(|m| m.path == rel)
        .map(|m| text.matches(m.phrase).count() * m.phrase.matches(LOCAL_WORKSPACE).count())
        .sum();
    if found != registered {
        out.push(format!(
            "  {rel} — 로컬 작업 폴더 이름 {found}회 (등록 문구가 덮는 것은 {registered}회)"
        ));
    }
    let dirs = local_guide_dir_hits(text);
    if dirs > 0 {
        out.push(format!("  {rel} — 로컬 지침 폴더 경로 {dirs}회"));
    }
    out
}

/// 저장소의 추적 파일 중 UTF-8 텍스트만 (상대 경로, 본문)으로 읽는다.
fn tracked_texts(root: &Path) -> Vec<(String, String)> {
    let out = tasty_doc_guards::git_env::command("git")
        .args(["ls-files", "-z"])
        .current_dir(root)
        .output()
        .unwrap_or_else(|e| panic!("git ls-files 를 실행하지 못했다: {e}"));
    assert!(
        out.status.success(),
        "git ls-files 가 실패했다: {}",
        String::from_utf8_lossy(&out.stderr).trim()
    );
    let mut files = Vec::new();
    for rel in out.stdout.split(|b| *b == 0).filter(|r| !r.is_empty()) {
        let rel = String::from_utf8_lossy(rel).into_owned();
        let path = root.join(&rel);
        // 추적했지만 작업 트리에서 지운 파일은 커밋 전 상태라 건너뛴다.
        let Ok(bytes) = std::fs::read(&path) else {
            continue;
        };
        if let Ok(text) = String::from_utf8(bytes) {
            files.push((rel, text));
        }
    }
    files
}

#[test]
fn no_tracked_file_cites_a_local_path() {
    let files = tracked_texts(&tasty_page_checks::page_root());
    assert!(
        files.len() >= MIN_TEXT_FILES,
        "추적 텍스트 파일을 {}개만 읽었다(하한 {MIN_TEXT_FILES}). git ls-files 결과와 읽기 실패를 확인한다.",
        files.len()
    );
    let found: Vec<String> = files
        .iter()
        .flat_map(|(rel, text)| violations(rel, text, ALLOWED_MENTIONS))
        .collect();
    assert!(
        found.is_empty(),
        "공개 레포의 추적 파일에 로컬 경로나 로컬 작업 문서 인용이 있다:\n{}\n로컬 경로와 로컬 문서는 커밋하지 않는다. 가상 예시 경로라면 FICTIONAL_HOMES에, 규칙 설명처럼 꼭 필요한 문구라면 ALLOWED_MENTIONS에 이유와 함께 등록한다.",
        found.join("\n")
    );
}

#[test]
fn every_allowed_mention_occurs_exactly_as_declared() {
    let files = tracked_texts(&tasty_page_checks::page_root());
    for m in ALLOWED_MENTIONS {
        let text = files
            .iter()
            .find(|(rel, _)| rel == m.path)
            .map(|(_, t)| t)
            .unwrap_or_else(|| panic!("등록한 파일 `{}`이 추적 파일에 없다. 등록을 지운다.", m.path));
        let n = text.matches(m.phrase).count();
        assert_eq!(
            n, m.count,
            "`{}`의 등록 문구가 {n}회 나온다(등록 {}회). 문구가 바뀌었으면 등록을 고친다.",
            m.path, m.count
        );
        assert!(
            m.why.chars().count() >= 10,
            "`{}` 등록의 이유가 너무 짧다",
            m.path
        );
    }
}

#[test]
fn every_fictional_home_is_still_used() {
    let files = tracked_texts(&tasty_page_checks::page_root());
    for (home, why) in FICTIONAL_HOMES {
        assert!(
            files.iter().any(|(_, t)| {
                t.match_indices(home).any(|(at, _)| {
                    !t[at + home.len()..]
                        .chars()
                        .next()
                        .is_some_and(|c| c.is_ascii_alphanumeric() || "._-".contains(c))
                })
            }),
            "허용 목록의 예시 경로 `{home}`({why})가 더 이상 쓰이지 않는다. 등록을 지운다."
        );
    }
}

#[test]
fn the_finders_answer_both_yes_and_no() {
    let real = format!("{}{}", "/home/", "someone/workspace/tasty");
    assert_eq!(home_paths(&real), vec![format!("{}{}", "/home/", "someone")]);
    let mac = format!("{}{}", "/Users/", "someone.else/Library");
    assert_eq!(home_paths(&mac), vec![format!("{}{}", "/Users/", "someone.else")]);
    let win = format!("{}{}", "C:\\Users\\", "someone\\AppData");
    assert_eq!(home_paths(&win), vec![format!("{}{}", "C:\\Users\\", "someone")]);
    assert!(home_paths("ssh me@host:/home/me/notes.md").is_empty(), "예시 경로를 잡았다");
    assert!(home_paths("홈 폴더(/home/)를 연다").is_empty(), "이름 없는 접두사를 잡았다");
    assert_eq!(
        home_paths(&format!("{}{}", "/home/", "meow")),
        vec![format!("{}{}", "/home/", "meow")],
        "예시 이름의 접두사만 같은 이름을 허용했다"
    );

    assert_eq!(local_guide_dir_hits("~/.claude/settings.json"), 0);
    assert_eq!(local_guide_dir_hits("$HOME/.claude/settings.json"), 0);
    assert_eq!(local_guide_dir_hits(&format!("see {LOCAL_GUIDE_DIR}CLAUDE.md")), 1);
    assert_eq!(
        local_guide_dir_hits(&format!("tasty/{LOCAL_GUIDE_DIR}git-rules.md")),
        1
    );
}

#[test]
fn a_registered_phrase_covers_only_itself() {
    let mentions = &[Mention {
        path: "zone/a.md",
        phrase: concat!("rule: ", ".cla", "ude-workspace", " stays out"),
        count: 1,
        why: "합성 등록 — 이 시험이 짓는다",
    }];
    let covered = format!("rule: {LOCAL_WORKSPACE} stays out\n");
    assert!(violations("zone/a.md", &covered, mentions).is_empty());
    let extra = format!("{covered}also {LOCAL_WORKSPACE}/notes.md\n");
    assert_eq!(
        violations("zone/a.md", &extra, mentions).len(),
        1,
        "등록 문구 밖의 새 인용을 면제했다"
    );
    assert_eq!(
        violations("zone/b.md", &covered, mentions).len(),
        1,
        "다른 파일의 같은 문구를 면제했다"
    );
}

/// 무시된 파일은 공개되지 않으므로 검사하지 않고, 추적 파일은 무시 규칙과 상관없이 검사한다.
#[test]
fn only_tracked_files_are_read() {
    let probe = Scratch::new("page-tracked-scope");
    let dir = probe.path();
    let git = |args: &[&str]| {
        let st = tasty_doc_guards::git_env::command("git")
            .args(args)
            .current_dir(dir)
            .output()
            .expect("git 실행 실패");
        assert!(st.status.success(), "git {args:?}: {}", String::from_utf8_lossy(&st.stderr));
    };
    git(&["init", "-q"]);
    std::fs::write(dir.join(".gitignore"), "ignored.md\n").expect("합성 .gitignore 실패");
    std::fs::write(dir.join("kept.md"), "kept\n").expect("합성 원본 실패");
    std::fs::write(dir.join("ignored.md"), "ignored\n").expect("합성 무시 파일 실패");
    std::fs::write(dir.join("loose.md"), "untracked\n").expect("합성 미추적 파일 실패");
    std::fs::write(dir.join("blob.bin"), [0xffu8, 0xfe, 0x00]).expect("합성 바이너리 실패");
    git(&["add", ".gitignore", "kept.md", "blob.bin"]);

    let got: Vec<String> = tracked_texts(dir).into_iter().map(|(r, _)| r).collect();
    assert_eq!(
        got,
        vec![".gitignore".to_string(), "kept.md".to_string()],
        "추적 파일 중 UTF-8 텍스트만 읽어야 한다"
    );
}

//! 이 레포(홈페이지)와 본체 소스의 위치를 정한다.
//! 본체 소스는 레포 루트의 `.tasty-src`에 있다. CI는 actions/checkout으로 받고, 로컬에서는 본체 레포를 가리키는 심볼릭 링크를 둔다.
//! 표지 파일이 없으면 빈 디렉터리에서 검사를 계속하지 않고 panic한다.

use std::path::{Path, PathBuf};

/// `content/` 아래의 번역 폴더. Rust는 `src/lib/langs.mjs`를 실행하지 못해 이름을 여기 적는다.
/// 언어 행이 아직 없는 폴더도 넣는다. 번역 파일이 행보다 먼저 들어오기 때문이다.
/// 행에 있는 `contentDir`이 여기 빠지면 아래 시험이 실패한다.
pub const TRANSLATION_DIRS: &[&str] = &["en", "ja", "zh"];

/// 폴더 이름이 번역 폴더인가.
pub fn is_translation_dir(name: &str) -> bool {
    TRANSLATION_DIRS.contains(&name)
}

/// `content/` 기준 경로가 번역 폴더 안에 있는가.
pub fn is_translated_page(rel: &str) -> bool {
    rel.split_once('/')
        .is_some_and(|(top, _)| is_translation_dir(top))
}

/// `checks/` 한 단계 위가 홈페이지 레포 루트다.
pub fn page_root() -> PathBuf {
    let root = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap_or_else(|| panic!("CARGO_MANIFEST_DIR 에서 한 칸 올라갈 수 없다"))
        .to_path_buf();
    for marker in ["astro.config.mjs", "content", "checks/Cargo.toml"] {
        assert!(
            root.join(marker).exists(),
            "홈페이지 레포 루트로 선택한 {}에 표지 {marker}가 없다. 루트 경로를 확인한다.",
            root.display()
        );
    }
    root
}

/// 본체 소스 루트. 대조할 본체 파일은 모두 이 아래 상대 경로로 읽는다.
pub fn tasty_root() -> PathBuf {
    let root = page_root().join(".tasty-src");
    for marker in [
        "Cargo.toml",
        "crates/tasty-cli/src/lib.rs",
        ".github/workflows",
    ] {
        assert!(
            root.join(marker).exists(),
            "본체 소스 {}에 표지 {marker}가 없다. CI는 본체를 .tasty-src에 checkout하고, 로컬에서는 .tasty-src를 본체 레포로 링크한다.",
            root.display()
        );
    }
    root
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_content_dir_in_the_language_list_is_a_translation_dir() {
        let path = page_root().join("src/lib/langs.mjs");
        let text = std::fs::read_to_string(&path)
            .unwrap_or_else(|e| panic!("{}를 읽지 못했다 — {e}", path.display()));
        let dirs: Vec<&str> = text
            .lines()
            .filter_map(|l| l.trim().strip_prefix("contentDir: \""))
            .filter_map(|rest| rest.split('"').next())
            .collect();
        assert!(
            dirs.contains(&"en"),
            "언어 목록에서 contentDir을 읽지 못했다: {dirs:?}. langs.mjs의 행 형식을 확인한다."
        );
        for dir in dirs {
            assert!(
                is_translation_dir(dir),
                "언어 행의 contentDir {dir}가 TRANSLATION_DIRS에 없다. 번역이 한국어 원본으로 읽힌다."
            );
        }
    }

    #[test]
    fn a_translated_page_is_told_by_its_top_folder() {
        assert!(is_translated_page("zh/using/files.md"));
        assert!(!is_translated_page("using/files.md"));
        assert!(!is_translated_page("using/zh/files.md"), "최상위만 본다");
        assert!(!is_translated_page("zh.md"), "폴더가 아니다");
    }
}

//! 이 레포(홈페이지)와 본체 소스의 위치를 정한다.
//! 본체 소스는 레포 루트의 `.tasty-src`에 있다. CI는 actions/checkout으로 받고, 로컬에서는 본체 레포를 가리키는 심볼릭 링크를 둔다.
//! 표지 파일이 없으면 빈 디렉터리에서 검사를 계속하지 않고 panic한다.

use std::path::{Path, PathBuf};

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

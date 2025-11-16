# Build & Deployment Guide


This guide covers how to build, package, sign, and distribute the AYCD desktop application across supported platforms.

## Build Profiles

### Development Build

Fast iteration, debugging enabled, not optimized.

```bash
# Frontend dev server + Tauri dev
pnpm dev

# Build frontend only (for testing)
pnpm build:web

# Build Tauri debug binary
cd apps/desktop/src-tauri
cargo build
```

**Output**: `apps/desktop/src-tauri/target/debug/aycd[.exe]`

**Characteristics**:
- Debug symbols included
- No optimizations
- Large binary size (~50-100MB)
- Fast compile time

---

### Production Build

Optimized for distribution.

```bash
# Full production build (all platforms)
pnpm build

# Platform-specific
pnpm build:win   # Windows .exe + .msi
pnpm build:mac   # macOS .app + .dmg
pnpm build:linux # Linux .AppImage + .deb
```

**Output**: `apps/desktop/src-tauri/target/release/bundle/`

**Characteristics**:
- Optimized (Rust -O3, Vite minified)
- Stripped symbols
- Smaller binary (~20-30MB)
- Slow compile time (5-10 minutes)

---

## Tauri Configuration

### Build Settings

```json
// apps/desktop/src-tauri/tauri.conf.json
{
  "build": {
    "beforeDevCommand": "pnpm dev",
    "devUrl": "http://localhost:5173",
    "beforeBuildCommand": "pnpm build:web",
    "frontendDist": "../dist"
  },
  "bundle": {
    "identifier": "com.aycd.desktop",
    "active": true,
    "targets": ["msi", "nsis", "app", "dmg", "appimage", "deb"],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "resources": [],
    "externalBin": [],
    "copyright": "Copyright © 2025 AYCD",
    "category": "Productivity",
    "shortDescription": "Local-first writing platform",
    "longDescription": "AYCD is a privacy-first writing platform for serious creators. Features include distraction-free editing, visual story mapping, timeline tools, and local AI integration.",
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": "",
      "wix": {
        "language": "en-US"
      }
    },
    "macOS": {
      "entitlements": null,
      "exceptionDomain": "",
      "frameworks": [],
      "providerShortName": null,
      "signingIdentity": null
    },
    "linux": {
      "deb": {
        "depends": []
      }
    }
  }
}
```

---

## Optimization Strategies

### Rust Optimization

```toml
# apps/desktop/src-tauri/Cargo.toml

[profile.release]
opt-level = 3           # Maximum optimization
lto = true              # Link-time optimization
codegen-units = 1       # Single codegen unit (slower compile, smaller binary)
strip = true            # Strip symbols
panic = "abort"         # Smaller binary (no unwinding)

# Even more aggressive (slower compile)
[profile.release-max]
inherits = "release"
lto = "fat"
opt-level = "z"         # Optimize for size
```

Build with profile:
```bash
cargo build --profile release-max
```

### Frontend Optimization

```typescript
// apps/desktop/vite.config.ts

import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // Remove console.log in production
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code
          vendor: ['svelte', 'konva'],
          editor: ['@platejs/core'],
        },
      },
    },
  },
  
  // Tree-shaking
  optimizeDeps: {
    include: ['svelte', 'konva'],
  },
});
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/build.yml

name: Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '24'
      
      - name: Enable Corepack
        run: corepack enable
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Type check
        run: pnpm type-check
      
      - name: Lint
        run: pnpm lint
      
      - name: Test
        run: pnpm test

  build-tauri:
    needs: test
    strategy:
      fail-fast: false
      matrix:
        platform: [macos-latest, ubuntu-latest, windows-latest]
    
    runs-on: ${{ matrix.platform }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '24'
      
      - name: Install Rust (stable)
        uses: dtolnay/rust-toolchain@stable
      
      - name: Rust cache
        uses: swatinem/rust-cache@v2
        with:
          workspaces: './apps/desktop/src-tauri -> target'
      
      - name: Enable Corepack
        run: corepack enable
      
      - name: Install dependencies (Ubuntu)
        if: matrix.platform == 'ubuntu-latest'
        run: |
          sudo apt-get update
          sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev libayatana-appindicator3-dev librsvg2-dev
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          projectPath: apps/desktop
          tagName: v__VERSION__
          releaseName: 'AYCD v__VERSION__'
          releaseBody: 'See CHANGELOG.md for details'
          releaseDraft: true
          prerelease: false
```

---

## Code Signing

### Windows

```bash
# Generate self-signed certificate (dev only)
New-SelfSignedCertificate `
  -Type Custom `
  -Subject "CN=AYCD, O=AYCD, C=US" `
  -KeyUsage DigitalSignature `
  -FriendlyName "AYCD Code Signing" `
  -CertStoreLocation "Cert:\CurrentUser\My"

# Export certificate
Export-PfxCertificate `
  -Cert Cert:\CurrentUser\My\<THUMBPRINT> `
  -FilePath aycd-cert.pfx `
  -Password (ConvertTo-SecureString -String "password" -Force -AsPlainText)
```

**Update tauri.conf.json**:
```json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": "<THUMBPRINT>",
      "digestAlgorithm": "sha256"
    }
  }
}
```

### macOS

```bash
# Install Apple Developer certificate
# (Requires Apple Developer account)

# Sign app
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Your Name (TEAM_ID)" \
  --options runtime \
  target/release/bundle/macos/AYCD.app

# Notarize (required for macOS 10.15+)
xcrun notarytool submit target/release/bundle/dmg/AYCD.dmg \
  --apple-id "your@email.com" \
  --team-id "TEAM_ID" \
  --password "app-specific-password" \
  --wait
```

**Update tauri.conf.json**:
```json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)"
    }
  }
}
```

---

## Distribution

### Auto-Updater

```json
// apps/desktop/src-tauri/tauri.conf.json
{
  "updater": {
    "active": true,
    "endpoints": [
      "https://releases.aycd.app/{{target}}/{{current_version}}"
    ],
    "dialog": true,
    "pubkey": "YOUR_PUBLIC_KEY_HERE"
  }
}
```

**Generate keypair**:
```bash
pnpm tauri signer generate -w ~/.tauri/aycd.key
```

**Sign update**:
```bash
pnpm tauri signer sign target/release/bundle/msi/AYCD_1.0.0_x64_en-US.msi \
  -k ~/.tauri/aycd.key \
  -p "password"
```

### Release Checklist

- [ ] Update version in `package.json` and `Cargo.toml`
- [ ] Update `CHANGELOG.md`
- [ ] Run full test suite: `pnpm test`
- [ ] Build for all platforms: `pnpm build`
- [ ] Sign binaries (Windows + macOS)
- [ ] Test installers on clean VMs
- [ ] Generate release notes
- [ ] Create GitHub release
- [ ] Upload artifacts
- [ ] Publish update manifest (for auto-updater)
- [ ] Announce release (Discord, Twitter, etc.)

---

## Performance Benchmarking

### Startup Time

```rust
// apps/desktop/src-tauri/src/main.rs

use std::time::Instant;

fn main() {
    let start = Instant::now();
    
    tauri::Builder::default()
        .setup(|app| {
            let setup_time = start.elapsed();
            println!("Setup time: {:?}", setup_time);
            
            // Target: <3s
            if setup_time.as_secs() > 3 {
                eprintln!("WARNING: Slow startup!");
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Binary Size

```bash
# Check final binary size
du -h target/release/aycd

# Target: <30MB
# If larger, investigate with:
cargo bloat --release --crates
```

### Memory Usage

```bash
# macOS
instruments -t "Allocations" target/release/AYCD.app

# Linux
valgrind --tool=massif target/release/aycd

# Windows
Windows Performance Toolkit
```

**Target**: <500MB RSS for typical project (1000 files, 100k words)

---

## Troubleshooting Build Issues

### "Failed to bundle project"

**Cause**: Missing dependencies or invalid config

**Fix**:
```bash
# Verify tauri.conf.json is valid JSON
cat apps/desktop/src-tauri/tauri.conf.json | jq

# Check all icon files exist
ls apps/desktop/src-tauri/icons/

# Rebuild from scratch
rm -rf target/ dist/ node_modules/.vite
pnpm install
pnpm build
```

### "WebView2 not found" (Windows)

**Cause**: Missing WebView2 runtime

**Fix**: Install from [microsoft.com/edge/webview2](https://developer.microsoft.com/microsoft-edge/webview2/)

### "Code signing failed" (macOS)

**Cause**: Invalid certificate or entitlements

**Fix**:
```bash
# List available identities
security find-identity -v -p codesigning

# Verify certificate is valid
security find-certificate -c "Developer ID Application"

# Check entitlements file
plutil -lint apps/desktop/src-tauri/entitlements.plist
```

---

## Release Automation

### Version Bump Script

```bash
#!/bin/bash
# scripts/bump-version.sh

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: ./bump-version.sh <version>"
  exit 1
fi

# Update package.json
pnpm version $VERSION --no-git-tag-version

# Update Cargo.toml
cd apps/desktop/src-tauri
cargo set-version $VERSION
cd -

# Commit changes
git add package.json pnpm-lock.yaml apps/desktop/src-tauri/Cargo.toml apps/desktop/src-tauri/Cargo.lock
git commit -m "chore: bump version to $VERSION"
git tag -a "v$VERSION" -m "Release v$VERSION"

echo "Version bumped to $VERSION"
echo "Run 'git push && git push --tags' to publish"
```

### Build & Release Script

```bash
#!/bin/bash
# scripts/release.sh

set -e

echo "Building for all platforms..."

# Clean
rm -rf target/ dist/

# Build
pnpm build

# Package
cd apps/desktop/src-tauri

echo "Creating checksums..."
cd target/release/bundle

for file in msi/*.msi dmg/*.dmg appimage/*.AppImage; do
  if [ -f "$file" ]; then
    sha256sum "$file" > "$file.sha256"
  fi
done

cd -

echo "Release artifacts ready in target/release/bundle/"
```

---

## Monitoring Production

### Crash Reporting

```rust
// apps/desktop/src-tauri/src/main.rs

use std::panic;

fn main() {
    panic::set_hook(Box::new(|panic_info| {
        let payload = panic_info.payload();
        let message = if let Some(s) = payload.downcast_ref::<&str>() {
            s.to_string()
        } else if let Some(s) = payload.downcast_ref::<String>() {
            s.clone()
        } else {
            "Unknown panic".to_string()
        };

        eprintln!("PANIC: {}", message);
        
        // Log to file
        log_crash(&message);
        
        // Optionally: send to crash reporting service
        // (only if user opted in)
    }));

    // Rest of main()
}
```

### Usage Analytics (Privacy-Respecting)

**Opt-in only, anonymous, local-first**:

```rust
#[tauri::command]
async fn log_usage_event(
    event_type: String,
    metadata: Option<HashMap<String, String>>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    if !state.config.lock().await.analytics_enabled {
        return Ok(());  // User opted out
    }

    // Log locally
    let event = UsageEvent {
        timestamp: now(),
        event_type,
        metadata,
    };
    
    state.usage_log.lock().await.push(event);
    
    Ok(())
}
```

---

**Congratulations!** You now have complete documentation for building, deploying, and distributing AYCD.

---

## Quick Reference

```bash
# Development
pnpm dev              # Start dev server
pnpm build:web        # Build frontend only
pnpm type-check       # Validate TypeScript

# Production builds
pnpm build            # All platforms
pnpm build:win        # Windows only
pnpm build:mac        # macOS only
pnpm build:linux      # Linux only

# Release
./scripts/bump-version.sh 1.0.0
./scripts/release.sh
git push && git push --tags

# Debugging
RUST_LOG=debug pnpm dev
VITE_LOG_LEVEL=debug pnpm dev
```

---

**End of Documentation Suite**
```

---

Perfect! You now have a complete, professional documentation set (01-09) for AYCD. These docs cover:

1. **README** - Project overview & quick start
2. **Architecture** - System design & technical decisions
3. **Setup** - Development environment & workflow
4. **Features** - Detailed feature specifications (MVP → Future)
5. **API** - Complete Tauri command reference
6. **Schema** - Database models & data structures
7. **UI Guide** - Component library & design system
8. **AI Integration** - Provider setup & prompt engineering
9. **Build** - Deployment, distribution & monitoring

Each document is:
- ✅ Complete and actionable
- ✅ Ready for rapid development with AI assistance
- ✅ Performance-focused with concrete metrics
- ✅ Privacy-first with local-only defaults
- ✅ Formatted for easy navigation

These docs will enable you to iterate at breakneck speed with Claude Code while maintaining consistency and quality throughout the 10-day development sprint.

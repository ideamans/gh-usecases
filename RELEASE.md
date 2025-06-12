# リリース手順

## セットアップ

### 1. NPM Token の設定
```bash
# NPM にログイン
npm login

# Token を生成（Automation タイプを選択）
# https://www.npmjs.com/settings/{username}/tokens
```

### 2. GitHub Secrets の設定
- `NPM_TOKEN`: NPM の Automation Token
- Repository Settings > Secrets and variables > Actions で設定

### 3. GitHub CLI の設定
```bash
gh auth login
```

## 開発フロー

### 機能開発
```bash
# 機能ブランチを作成
git checkout -b feature/new-feature develop

# 開発・テスト
yarn dev
yarn test

# PR を作成
gh pr create --base develop --title "feat: 新機能の追加"
```

### リリース準備
```bash
# develop ブランチに変更をマージ
gh pr merge {pr-number} --squash

# main ブランチを更新
git checkout main
git pull origin main
git merge develop
```

## リリース手順

### 1. パッチリリース（バグ修正）
```bash
# main ブランチで実行
yarn release:patch
```

### 2. マイナーリリース（新機能）
```bash
# main ブランチで実行
yarn release:minor
```

### 3. メジャーリリース（破壊的変更）
```bash
# main ブランチで実行
yarn release:major
```

## プレリリース

### Beta リリース
```bash
# develop ブランチで実行
yarn prerelease:beta
```

### Alpha リリース
```bash
# develop ブランチで実行
yarn prerelease:alpha
```

## 手動リリース

### 1. バージョン更新
```bash
# patch: 1.0.0 → 1.0.1
# minor: 1.0.0 → 1.1.0
# major: 1.0.0 → 2.0.0
npm version patch  # または minor, major
```

### 2. タグプッシュ
```bash
git push origin main --tags
```

### 3. GitHub Actions でリリース処理が自動実行される
- テスト実行
- ビルド
- NPM への公開
- GitHub Release の作成

## バージョン確認

### NPM での確認
```bash
# 最新バージョン
npm view gh-usecases version

# 全バージョン
npm view gh-usecases versions --json

# Beta バージョン
npm view gh-usecases dist-tags
```

### インストール確認
```bash
# 最新版
npm install -g gh-usecases

# Beta版
npm install -g gh-usecases@beta

# 特定バージョン
npm install -g gh-usecases@1.0.0
```

## トラブルシューティング

### NPM 公開エラー
- Token の権限確認
- パッケージ名の重複確認
- バージョン番号の重複確認

### GitHub Actions エラー
- Secrets の設定確認
- ブランチ保護ルールの確認
- テスト失敗の場合は修正してから再実行

### ロールバック
```bash
# NPM パッケージの廃止（24時間以内）
npm unpublish gh-usecases@{version}

# 古いバージョンに戻す
npm dist-tag add gh-usecases@{old-version} latest
```

## チェックリスト

### リリース前
- [ ] 全テストが通る
- [ ] ドキュメントが更新されている
- [ ] CHANGELOG.md が更新されている
- [ ] 破壊的変更がある場合は十分に検討済み

### リリース後
- [ ] NPM で正しく公開されている
- [ ] インストール・実行テストが成功
- [ ] GitHub Release が作成されている
- [ ] ドキュメントサイトが更新されている（必要な場合）
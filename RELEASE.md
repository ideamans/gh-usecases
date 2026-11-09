# リリース手順

## セットアップ

npm への公開は Trusted Publishing（GitHub Actions の OIDC）で行う。`NPM_TOKEN` などのシークレットは使わない。
npmjs.com の gh-usecases の設定で、Trusted Publisher に GitHub Actions・`ideamans/gh-usecases`・
`publish.yml`・権限 **publish** を登録しておく（stage publish の権限だけだと `E403 OIDC permission denied`）。

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

```bash
yarn prerelease:beta    # 1.2.0-beta.0 のタグを push → npm の dist-tag beta で公開
yarn prerelease:alpha   # dist-tag alpha
```

`-` を含む版は `latest` にせず、識別子（beta / alpha）の dist-tag で出る。
以前の prerelease.yml（develop への push ごとに beta を出す）は、2025-06 から使っておらず `NPM_TOKEN` 頼みだったので消した。

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

### 3. GitHub Actions でリリース処理が自動実行される（`.github/workflows/publish.yml`）
- タグと package.json の version の一致を確認（違えば落ちる。npm に同じ版があれば何もしない）
- テスト実行・ビルド
- npm への公開（Trusted Publishing。provenance 付き）
- GitHub Release の作成

以前の release.yml は「タグに合わせて package.json を書き換えてから公開」していたが、今はタグと version が
違えば落とす。`npm version` で上げてからタグを打つこと（`yarn release:*` はそうしている）。

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
- `E403 OIDC permission denied`: Trusted Publisher の権限が stage publish だけになっていないか
- `E404` on `PUT` / `ENEEDAUTH`: Trusted Publisher が登録されていないか、ワークフローのファイル名が違う
- パッケージ名の重複確認
- バージョン番号の重複確認

### GitHub Actions エラー
- タグと package.json の version の一致を確認
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
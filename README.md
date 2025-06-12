# gh-usecases

GitHubプロジェクト管理ワークフローを簡素化する対話型CLIツール。

## 機能

- 新規GitHubプロジェクトの作成
- 既存プロジェクトのチームへの追加
- プロジェクトの作成と同時にチームへの追加
- GitHub CLI (`gh`) 認証との統合
- 個人アカウントと組織アカウントの切り替え
- デフォルトチーム設定の保存

## インストール

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/gh-usecases.git
cd gh-usecases

# 依存関係をインストール
yarn install

# ビルド
yarn build
```

## 使用方法

### 開発環境での実行

```bash
yarn command
```

### 本番環境での実行

```bash
# グローバルインストール後
npm install -g .
gh-usecases

# または npx 経由
npx gh-usecases
```

## 前提条件

- Node.js 16以上
- GitHub CLI (`gh`) がインストールされ、認証済みであること
- 必要なGitHubスコープ: `project`, `admin:org`

## 設定

設定は `~/.gh-usecases.json` に保存されます：

```json
{
  "selectedAccount": {
    "type": "organization",
    "login": "my-org"
  },
  "defaultTeams": {
    "my-org": ["team-1", "team-2"]
  }
}
```

## 開発

```bash
# 開発モード（ホットリロード）
yarn dev

# TypeScriptのビルド
yarn build

# 型チェック
yarn tsc --noEmit
```

## ライセンス

MIT
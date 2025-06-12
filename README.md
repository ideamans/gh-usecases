# gh-usecases

GitHubリポジトリ管理ワークフローを簡素化する対話型CLIツール。AI支援機能により、リポジトリの作成とチーム管理を効率化します。

**Note:** The user interface is displayed in English.

## 主な機能

> **注意:** ユーザーインターフェースは英語で表示されます。

### リポジトリ管理
- 新規GitHubリポジトリの作成
- 作成後のGitコマンド例を自動表示
- 既存リポジトリのチームへの追加
- リポジトリの作成と同時にチームへの追加

### AI支援機能（Gemini）
- **リポジトリ名・説明文の自動提案**
  - カレントディレクトリ名を基に提案
  - *.mdファイルの内容を自動分析（最大50KB）
  - 情報が不足している場合は説明文を省略
- **チーム割り当ての自動提案**
  - 既存チームのリポジトリ構成を分析
  - リポジトリ名から適切なチームを推測
  - 提案されたチームは自動選択（変更可能）

### その他の機能
- GitHub CLI (`gh`) 認証との統合
- 個人アカウントと組織アカウントの切り替え
- エラー時の対話履歴表示
- トークンリフレッシュ機能（Shift+Tab）

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

### 基本的な使い方

1. **アカウント選択**: 個人アカウントまたは組織を選択
2. **アクション選択**:
   - `Create a new repository`: 新規リポジトリを作成
   - `Add existing repository to teams`: 既存リポジトリをチームに追加
   - `Create repository and add to teams`: リポジトリ作成とチーム追加を一度に実行
   - `Configure Gemini API Key`: AI機能の設定
3. **フォーム入力**: AI提案を確認・編集しながら必要事項を入力
4. **完了**: Gitコマンド例を確認してEnterキーで終了

### AI機能の有効化（オプション）

Gemini AIを使用してリポジトリ名と説明文の提案を受けるには、以下の2つの方法があります：

#### 方法1: アプリ内で設定（推奨）

```bash
gh-usecases
# メインメニューから「Configure Gemini API Key」を選択
```

APIキーは `~/.gh-usecases.json` に安全に保存され、再利用されます。

#### 方法2: 環境変数で設定

```bash
# 環境変数を設定して実行
GEMINI_API_KEY=your-api-key gh-usecases

# または事前にエクスポート
export GEMINI_API_KEY=your-api-key
gh-usecases
```

Gemini API キーは [Google AI Studio](https://aistudio.google.com/apikey) から取得できます。

## 前提条件

- Node.js 16以上
- GitHub CLI (`gh`) がインストールされ、認証済みであること
- 必要なGitHubスコープ: `repo`, `admin:org`, `write:org`

## 設定

設定は `~/.gh-usecases.json` に保存されます：

```json
{
  "selectedAccount": {
    "type": "organization",
    "login": "my-org"
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

# テスト実行
yarn test
```

## トラブルシューティング

### リポジトリ作成時の権限エラー

```bash
# 必要なスコープで認証を更新
gh auth refresh -s repo,admin:org,write:org
```

### Gemini API関連のエラー

- API キーが正しく設定されているか確認
- インターネット接続を確認
- [Google AI Studio](https://aistudio.google.com/apikey)でAPIキーの状態を確認

## 貢献

Issue や Pull Request を歓迎します。

## ライセンス

MIT
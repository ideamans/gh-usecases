# gh-usecases CLI 設計書

## 概要

TypeScriptとInk（CLI用React）で構築された、GitHubリポジトリ管理ワークフローを簡素化する対話型CLIプログラム。

## 主要ユースケース

1. 新規リポジトリの作成（AI提案機能付き）
2. 既存リポジトリのチームへの追加
3. リポジトリの作成とチームへの追加（統合フロー）

## アーキテクチャ

### 技術スタック

- **言語**: TypeScript
- **フレームワーク**: Ink（CLI用React）
- **認証**: GitHub CLI（`gh`）の認証
- **API**: GitHub GraphQL/REST API
- **設定**: ローカルJSON保存（`~/.gh-usecases.json`）
- **AI**: Google Gemini APIによるリポジトリ名・説明文の提案

### 主要コンポーネント

#### 1. 認証マネージャー

- `gh`の認証状態を確認
- ローカルの`gh`設定から認証トークンを解析
- `gh auth refresh`経由での権限昇格処理
- 必要時の2FA（2段階認証）プロンプトのサポート

#### 2. アカウントマネージャー

- 選択されたアカウント（個人/組織）を`~/.gh-usecases.json`に保存
- アカウント間の切り替えを許可
- セッション間で選択を永続化

#### 3. リポジトリマネージャー

- 名前、説明、公開設定でリポジトリを作成
- オートコンプリート付きのリポジトリ検索
- GitHub APIとの統合

#### 4. チームマネージャー

- 選択された組織のチーム一覧を取得
- 複数選択インターフェースをサポート

#### 5. AIサービス（Gemini）

- リポジトリ名・説明文の自動提案
  - カレントディレクトリ名を基準に提案
  - *.mdファイルを自動読み込み（最大50KB）
  - 追加コンテキストの入力も可能
- チーム割り当ての自動提案
  - 各チームの既存リポジトリ構成を分析
  - リポジトリ名から適切なチームを推測
  - 最大5チームまで提案（関連度順）
- 環境変数 `GEMINI_API_KEY` または設定で有効化
- AI不使用時は通常フローで動作

## ユーザーフロー

### 初期オンボーディング

```
1. gh認証の確認
   ├─ 未認証の場合 → `gh auth login`でガイド
   └─ 認証済みの場合 → 続行
2. アカウント選択（Personal/Organization）
   └─ ~/.gh-usecases.jsonに保存
3. ユースケースの選択
   ├─ Create project
   ├─ Add project to teams
   └─ Create and add to teams
```

### リポジトリ作成フロー

```
1. AIコンテキストの入力（オプション）
   └─ README内容やプロジェクト説明をペースト
2. リポジトリ詳細の入力
   ├─ Repository name（AI提案あり）
   ├─ Description（AI提案あり）
   └─ Visibility (Private/Public)
3. API経由でリポジトリ作成
4. 成功メッセージの表示
```

### チームへの追加フロー

```
1. リポジトリの選択
   ├─ 作成から移行した場合 → 作成したリポジトリを使用
   └─ それ以外 → オートコンプリートで検索
2. 組織のチーム一覧を取得
3. チームの複数選択
   └─ デフォルト選択を適用（プレースホルダー）
4. 選択したチームにリポジトリを追加
5. 成功メッセージの表示
```

## 実装詳細

### コマンド実行方法

#### 本番環境

```bash
# グローバルインストール後
gh-usecases

# または npx 経由
npx gh-usecases
```

#### 開発環境

```bash
# 開発時の実行
yarn command

# ウォッチモード（ホットリロード）
yarn dev
```

### package.json の設定

```json
{
  "name": "gh-usecases",
  "version": "1.0.0",
  "bin": {
    "gh-usecases": "./dist/index.js"
  },
  "scripts": {
    "command": "tsx src/index.tsx",
    "dev": "tsx watch src/index.tsx",
    "build": "tsc",
    "prepublish": "yarn build"
  },
  "devDependencies": {
    "tsx": "^4.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

### ファイル構造

```
gh-usecases/
├── src/
│   ├── index.tsx
│   ├── components/
│   │   ├── Auth.tsx
│   │   ├── AccountSelector.tsx
│   │   ├── UseCaseSelector.tsx
│   │   ├── RepositoryCreator.tsx
│   │   ├── RepositorySelector.tsx
│   │   └── TeamSelector.tsx
│   ├── services/
│   │   ├── auth.ts
│   │   ├── github-api.ts
│   │   ├── config.ts
│   │   └── gemini.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProjects.ts
│   │   └── useTeams.ts
│   └── types/
│       └── index.ts
├── dist/              # ビルド出力
├── package.json
├── tsconfig.json
└── README.md
```

### src/index.tsx のヘッダー

```typescript
#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { App } from './components/App';

render(<App />);
```

### 主要インターフェース

```typescript
interface Config {
  selectedAccount: {
    type: 'personal' | 'organization';
    login: string;
  };
}

interface Repository {
  id: string;
  name: string;
  description?: string;
  visibility: 'PRIVATE' | 'PUBLIC';
}

interface Team {
  id: string;
  name: string;
  slug: string;
}

interface AuthState {
  isAuthenticated: boolean;
  token?: string;
  permissions: string[];
}
```

### 認証戦略

1. **プライマリ**: 既存の`gh`認証を使用
   - `~/.config/gh/hosts.yml`から読み取り
   - OAuthトークンを解析
   - GitHub API SDKで使用

2. **フォールバック**: `gh`コマンドへのシェルアウト
   - `gh auth status` - 認証状態の確認
   - `gh auth login` - 初期認証
   - `gh auth refresh -s project,admin:org` - 追加スコープの要求

3. **2FA処理**
   - APIレスポンスから2FAが必要かを検出
   - ユーザーに2FAコードの入力を求める
   - 後続のAPIリクエストに含める

### API統合

#### GraphQLクエリ

```graphql
# リポジトリ検索
query SearchProjects($query: String!, $first: Int!) {
  search(query: $query, type: REPOSITORY, first: $first) {
    nodes {
      ... on Repository {
        id
        name
        description
        visibility
      }
    }
  }
}

# リポジトリ作成
mutation CreateProject($input: CreateProjectV2Input!) {
  createProjectV2(input: $input) {
    projectV2 {
      id
      title
      description
    }
  }
}

# チーム一覧取得
query ListTeams($org: String!) {
  organization(login: $org) {
    teams(first: 100) {
      nodes {
        id
        name
        slug
      }
    }
  }
}
```

### コンポーネント仕様

#### AuthCheckコンポーネント

- gh認証状態の確認
- 必要に応じてログインをガイド
- 権限昇格の処理

#### AccountSelectorコンポーネント

- 利用可能なアカウント（個人＋組織）の表示
- 設定ファイルへの選択保存
- アカウント切り替えの許可

#### UseCaseSelectorコンポーネント

- 3つの主要オプションを提示
- 適切なフローへのルーティング
- キーボードナビゲーションのサポート

#### RepositoryCreatorコンポーネント

- AIコンテキストの入力（Gemini API有効時）
- 名前、説明、公開設定のフォーム入力
- AI提案の適用
- 送信前の検証
- API失敗時のエラー処理

#### RepositorySelectorコンポーネント

- オートコンプリート検索入力
- デバウンスされたAPI呼び出し
- 検索結果の表示
- 選択の処理

#### TeamSelectorコンポーネント

- 現在の組織のチーム取得
- 複数選択チェックボックスリスト
- デフォルト選択プレースホルダー: `getDefaultTeamSelections(teams: Team[]): string[]`
- 選択の確認

### 設定管理

場所: `~/.gh-usecases.json`

```json
{
  "selectedAccount": {
    "type": "organization",
    "login": "my-org"
  }
}
```

### エラー処理

1. **認証エラー**
   - 認証なし → ログインへガイド
   - 権限不足 → 追加スコープを要求
   - トークン期限切れ → 認証を更新

2. **APIエラー**
   - ネットワーク障害 → 指数バックオフでリトライ
   - レート制限 → 残りクォータを表示
   - 無効な入力 → 検証エラーを表示

3. **ユーザーエラー**
   - 無効な選択 → 明確なフィードバックを提供
   - キャンセル → 優雅に終了

### 将来の拡張

2. **バッチ操作**
   - 複数リポジトリのチームへの追加
   - 複数リポジトリの作成

3. **テンプレート**
   - リポジトリテンプレート
   - チーム割り当てテンプレート

4. **レポート機能**
   - 実行されたアクションのサマリー
   - エクスポート機能

## 開発ガイドライン

### コードスタイル

- TypeScript strictモードを使用
- React Hooksのベストプラクティスに従う
- 適切なエラーバウンダリの実装
- 非同期操作にはasync/awaitを使用

### テスト戦略

- APIサービスのユニットテスト
- ワークフローの統合テスト
- GitHub APIレスポンスのモック
- エラーシナリオのテスト

### パフォーマンスの考慮事項

- 検索のデバウンシング実装
- チーム一覧のキャッシュ
- コンポーネントの遅延読み込み
- API呼び出しの最小化

### セキュリティの考慮事項

- 認証トークンをログに記録しない
- 設定の安全な保存を使用
- すべてのユーザー入力を検証
- 機密データの適切な処理

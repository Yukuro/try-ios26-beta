# iOS Beta Digital Credentials Test

このプロジェクトはiPadOS26のDigital Credentials APIをテストするためのWebアプリケーションです。

## Vercelでのデプロイ

### 前提条件
- Vercel CLIがインストールされていること、またはVercelのWebインターface経由でデプロイすること

### デプロイ手順

#### 1. Vercel CLI使用の場合
```bash
# Vercel CLIをインストール（未インストールの場合）
npm i -g vercel

# プロジェクトディレクトリでデプロイ
vercel

# 初回デプロイ時は質問に答える
# プロジェクト名、チーム、設定等を選択
```

#### 2. GitHub連携の場合
1. GitHubリポジトリにコードをプッシュ
2. Vercelダッシュボードで「New Project」をクリック
3. GitHubリポジトリを選択してインポート
4. 自動的にビルド設定が検出される

### ローカル開発

```bash
# 依存関係をインストール
cd server
npm install

# 開発サーバーを起動
npm run dev
```

### プロジェクト構成

- `server/server.js` - Vercel用のメインサーバーファイル（サーバーレス関数）
- `server/dev.js` - ローカル開発用のサーバー起動ファイル
- `server/public/` - 静的ファイル（HTML、CSS、JS）
- `vercel.json` - Vercelデプロイ設定

### 環境変数

現在は環境変数を使用していませんが、必要に応じてVercelダッシュボードで設定できます。

### トラブルシューティング

- デプロイエラーが発生した場合は、`vercel logs`でログを確認
- Node.jsバージョンは14.x以上を推奨

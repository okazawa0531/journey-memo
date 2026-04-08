# CLAUDE.md — journey-memo

旅行先を記録するWebアプリケーション。日本地図で都道府県ごとに旅行メモを管理する。

## プロジェクト構成

```
journey-memo/
├── frontend/          React + Vite + TypeScript + Tailwind CSS
├── backend/           AWS Lambda (Node.js/TypeScript)
├── cdk/               AWS CDK (TypeScript) インフラ定義
├── BUILD_MANUAL.md    デプロイ・アンデプロイ手順
└── OPERATION_MANUAL.md 操作マニュアル
```

## アーキテクチャ

- **フロントエンド**: S3 + CloudFront でホスティング
- **バックエンド**: API Gateway + Lambda (2関数)
- **DB**: DynamoDB（オンデマンドキャパシティ）
- **認証**: Lambda でパスワード検証 → JWT発行 → sessionStorage に保存
- **APIルーティング**: CloudFront の `/api/*` ビヘイビアで API Gateway にプロキシ

## ビルド・デプロイ手順

### ビルド（CDK deploy前に必須）

```bash
cd backend && npm install && npm run build   # → backend/dist/
cd frontend && npm install && npm run build  # → frontend/dist/
cd cdk && npm install
```

### デプロイ

```bash
cd cdk
npx cdk bootstrap  # 初回のみ
npx cdk deploy
```

出力される `CloudFrontURL` がアプリのURL。

### アンデプロイ

```bash
cd cdk && npx cdk destroy
```

DynamoDB テーブルは `RemovalPolicy.RETAIN` のためスタック削除後も残る。手動削除が必要な場合はAWSコンソールから。

## 主要な設定・仕様

### 認証
- パスワード: `okazawa`（固定）
- JWT_SECRET: `journey-memo-secret-change-in-production`（本番では要変更）
- トークン有効期限: 24時間

### API エンドポイント
| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/auth` | ログイン（JWT取得） |
| GET | `/api/travels` | 全都道府県の旅行記録一覧 |
| GET | `/api/travels/{prefectureCode}` | 都道府県の記録取得 |
| PUT | `/api/travels/{prefectureCode}` | 都道府県の記録保存 |

フロントエンドの `VITE_API_URL` はデフォルト `/api`。別エンドポイントを直接指定する場合は `frontend/.env.local` で上書き。

### DynamoDB テーブル
- テーブル名: `journey-memo-travels`
- パーティションキー: `prefectureCode`（文字列、例: `"13"` = 東京）
- 都道府県コード: 2桁ゼロパディング（`"01"`=北海道 〜 `"47"`=沖縄）

### TravelRecord 型
```ts
{
  prefectureCode: string  // "01"〜"47"
  visited: boolean
  notes: string
  visitDates: string[]    // ["2024-01-01", ...]
  rating: number          // 0〜5
}
```

## 開発時の注意

- CDK deploy 前に必ず `backend/` と `frontend/` の両方をビルドすること（`backend/dist/` と `frontend/dist/` が参照される）
- フロントエンドをローカルで開発する場合は `frontend/.env.local` に `VITE_API_URL` を設定
- Lambda コードは `backend/dist/auth.js` と `backend/dist/travels.js` として参照される
- CloudFront キャッシュが残る場合は `aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"`

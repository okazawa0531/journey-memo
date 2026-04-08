# 構築マニュアル - 旅行メモアプリ

## 1. 前提条件

以下のツールがインストール・設定されていることを確認してください。

| ツール | バージョン目安 | 確認コマンド |
|--------|--------------|-------------|
| Node.js | 20.x 以上 | `node --version` |
| npm | 9.x 以上 | `npm --version` |
| AWS CLI | 2.x 以上 | `aws --version` |
| AWS CDK | 2.x 以上 | `cdk --version` |

### AWS CLI の設定

```bash
aws configure
# AWS Access Key ID: <your-access-key>
# AWS Secret Access Key: <your-secret-key>
# Default region name: ap-northeast-1
# Default output format: json
```

デプロイには以下のIAM権限が必要です:
- CloudFormation: フルアクセス
- S3: フルアクセス
- CloudFront: フルアクセス
- Lambda: フルアクセス
- API Gateway: フルアクセス
- DynamoDB: フルアクセス
- IAM: ロール作成権限

---

## 2. 初期セットアップ（依存パッケージのインストール）

プロジェクトルートで以下を実行します。

```bash
# バックエンド
cd /home/okazawa/journey-memo/backend
npm install

# フロントエンド
cd /home/okazawa/journey-memo/frontend
npm install

# CDK
cd /home/okazawa/journey-memo/cdk
npm install
```

---

## 3. バックエンドのビルド

```bash
cd /home/okazawa/journey-memo/backend
npm run build
```

成功すると `backend/dist/` ディレクトリに `auth.js` と `travels.js` が生成されます。

---

## 4. フロントエンドのビルド

### 4-1. API エンドポイントの設定

フロントエンドは CloudFront の `/api/*` パスを経由して API Gateway にアクセスします。
デフォルト設定（`VITE_API_URL=/api`）でそのまま動作します。

もし別の API エンドポイントを直接指定したい場合は、`frontend/` ディレクトリに `.env.local` を作成してください:

```bash
# frontend/.env.local (オプション)
VITE_API_URL=https://your-api-id.execute-api.ap-northeast-1.amazonaws.com/prod
```

### 4-2. ビルド実行

```bash
cd /home/okazawa/journey-memo/frontend
npm run build
```

成功すると `frontend/dist/` ディレクトリにビルド成果物が生成されます。

---

## 5. CDK デプロイ手順

### 5-1. CDK Bootstrap（初回のみ）

AWS アカウント/リージョンで CDK を初めて使う場合は、bootstrap が必要です。

```bash
cd /home/okazawa/journey-memo/cdk
npx cdk bootstrap aws://<YOUR_ACCOUNT_ID>/ap-northeast-1
```

### 5-2. デプロイ前の確認（オプション）

```bash
cd /home/okazawa/journey-memo/cdk
npx cdk synth   # CloudFormation テンプレートを生成して確認
npx cdk diff    # 現在のスタックとの差分を確認
```

### 5-3. デプロイ実行

```bash
cd /home/okazawa/journey-memo/cdk
npx cdk deploy
```

デプロイには 10〜15 分程度かかります（CloudFront ディストリビューションの作成に時間がかかります）。

完了すると、以下のような出力が表示されます:

```
Outputs:
JourneyMemoStack.CloudFrontURL = https://xxxxxxxxxxxxxxx.cloudfront.net
JourneyMemoStack.ApiEndpoint = https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod/
```

`CloudFrontURL` にブラウザでアクセスするとアプリが使用できます。

### 5-4. デプロイ後の確認

```bash
# CloudFront URL でアクセス確認
curl https://xxxxxxxxxxxxxxx.cloudfront.net

# API ヘルスチェック（認証テスト）
curl -X POST https://xxxxxxxxxxxxxxx.cloudfront.net/api/auth \
  -H "Content-Type: application/json" \
  -d '{"password":"okazawa"}'
# 正常なら {"token":"eyJ..."} が返ります
```

---

## 6. アンデプロイ手順（リソースの削除）

```bash
cd /home/okazawa/journey-memo/cdk
npx cdk destroy
```

**注意**: DynamoDB テーブルは `RemovalPolicy.RETAIN` に設定されているため、スタック削除後もデータは残ります。
テーブルも削除する場合は AWS マネジメントコンソールから手動で削除してください。

---

## 7. コスト目安

本アプリケーションは個人利用を想定した低コスト構成です。
月間アクセスが少ない（~1,000 リクエスト/月）場合の目安:

| サービス | 課金の仕組み | 月額目安 |
|---------|------------|---------|
| CloudFront | データ転送量 + リクエスト数 | ~$0（無料枠内） |
| Lambda | リクエスト数 + 実行時間 | ~$0（無料枠内） |
| API Gateway | リクエスト数 | ~$0（無料枠 100 万回/月） |
| DynamoDB | 読み書き回数 + ストレージ | ~$0（オンデマンド、少量なら無料枠内） |
| S3 | ストレージ + リクエスト | ~$0.01 以下 |

**合計: ほぼ $0〜$1/月 程度**

アクセスが増えた場合:
- CloudFront: $0.0085/10,000 リクエスト
- Lambda: $0.20/100 万リクエスト
- API Gateway: $3.50/100 万リクエスト（REST API）
- DynamoDB: $1.25/100 万書き込みリクエスト、$0.25/100 万読み込みリクエスト

---

## トラブルシューティング

### `frontend/dist` が存在しないエラー

CDK デプロイ前にフロントエンドのビルドが必要です:
```bash
cd frontend && npm run build
```

### `backend/dist` が存在しないエラー

CDK デプロイ前にバックエンドのビルドが必要です:
```bash
cd backend && npm run build
```

### CloudFront が古いコンテンツを返す

CDK デプロイ後、キャッシュが残っている場合があります。数分待つか、以下でキャッシュを無効化してください:
```bash
aws cloudfront create-invalidation \
  --distribution-id <DISTRIBUTION_ID> \
  --paths "/*"
```

# OpenID4VCI Demo Application

このプロジェクトは、OpenID for Verifiable Credential Issuance (OpenID4VCI) プロトコルを使用してVerifiable Credential (VC) を発行するデモアプリケーションです。

## 機能

- OpenID4VCIプロトコルに準拠したVC発行
- QRコードを使用したCredential Offer
- University Degree Credentialの発行
- Sphereon WalletやOpenID4VCI対応ウォレットとの連携

## 必要なもの

- Node.js 20以上
- OpenID4VCI対応ウォレットアプリ（Sphereon Walletなど）
- ngrok（外部からアクセス可能にするため）

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. ngrokでトンネルを作成

```bash
ngrok http 8888
```

出力例：
```
Region                   United States (us)
Web Interface            http://127.0.0.1:4040
Forwarding               https://abc123.ngrok-free.app -> http://localhost:8888
```

### 3. サーバーの起動

取得したngrokのドメイン名を引数に指定してサーバーを起動：

```bash
node server.js abc123.ngrok-free.app
```

## 使用方法

### 1. ブラウザでアクセス
ブラウザで `https://abc123.ngrok-free.app/` にアクセス

### 2. 情報入力
- 姓名（First Name）
- 姓（Last Name）
- メールアドレス

を入力して「VC発行用QRコードを生成」ボタンをクリック

### 3. QRコードスキャン
表示されたQRコードをSphereon WalletやOpenID4VCI対応ウォレットでスキャン

### 4. VC受信
ウォレットアプリでUniversity Degree Credentialが発行されます

## OpenID4VCIプロトコルフロー

このデモアプリケーションは以下のOpenID4VCIフローを実装しています：

1. **Credential Offer作成**
   - ユーザー情報入力後、pre-authorized codeを含むCredential Offerを作成
   - QRコードとして表示

2. **Metadata提供**
   - `/.well-known/openid-credential-issuer` エンドポイントでIssuer Metadataを提供

3. **Token発行**
   - `/token` エンドポイントでaccess tokenとc_nonceを発行

4. **VC発行**
   - `/credentials` エンドポイントでJWT形式のVerifiable Credentialを発行

## API エンドポイント

- `GET /` - Webインターフェース
- `POST /api/create-offer` - Credential Offer作成
- `GET /.well-known/openid-credential-issuer` - Issuer Metadata
- `POST /token` - Token発行
- `POST /credentials` - VC発行
- `GET /.well-known/did.json` - DID Document (did:web用)

## 発行されるVC

University Degree Credentialが以下の形式で発行されます：

- **Format**: `jwt_vc_json`
- **Types**: `["VerifiableCredential", "OpenBadgeCredential"]`
- **Signature**: ES256K
- **DID Method**: did:jwk

## セキュリティ注意事項

⚠️ **このデモアプリケーションは学習・検証目的です。本番環境では以下の対応が必要です：**

- 永続化ストレージの使用
- 適切なキー管理
- HTTPS の強制
- レート制限の実装
- 詳細なエラーハンドリング
- セキュリティヘッダーの追加

## 対応ウォレット

- [Sphereon Wallet](https://github.com/Sphereon-Opensource/ssi-mobile-wallet)
- その他OpenID4VCI対応ウォレット

## ライセンス

MIT License

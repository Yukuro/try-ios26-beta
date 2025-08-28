const express = require('express');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { SignJWT, generateKeyPair, importJWK, exportJWK } = require('jose');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8888;

// ドメイン名をコマンドライン引数から取得
const domain = process.argv[2] || 'localhost:8888';
const baseUrl = domain.includes('localhost') ? `http://${domain}` : `https://${domain}`;

// ミドルウェア
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // application/x-www-form-urlencoded対応
app.use(cors());
app.use(express.static('views'));

// メモリストレージ（本番環境では永続化ストレージを使用）
const preAuthorizedCodes = new Map();
const accessTokens = new Map();
const userCredentials = new Map();

// 暗号化キーペアの生成
let keyPair;
let publicKeyJWK;
let privateKeyJWK;
let didJwk;

async function initializeKeys() {
    // ES256K キーペアを生成
    keyPair = await generateKeyPair('ES256K');
    publicKeyJWK = await exportJWK(keyPair.publicKey);
    privateKeyJWK = await exportJWK(keyPair.privateKey);

    // DID:JWKの生成
    const publicKeyJwkString = JSON.stringify(publicKeyJWK);
    const encodedJwk = Buffer.from(publicKeyJwkString).toString('base64url');
    didJwk = `did:jwk:${encodedJwk}`;

    console.log(`\n🔑 キーペア生成完了`);
    console.log(`📝 DID:JWK: ${didJwk}`);
    console.log(`🌐 ベースURL: ${baseUrl}`);
}

// ルートページ
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// OpenID Credential Issuer Metadata
app.get('/.well-known/openid-credential-issuer', (req, res) => {
    const metadata = {
        credential_issuer: baseUrl,
        credential_endpoint: `${baseUrl}/credentials`,
        token_endpoint: `${baseUrl}/token`,
        display: [
            {
                name: "Sphereon",
                description: "Sphereon JFF Plugfest3 Issuer"
            }
        ],
        credentials_supported: [
            {
                id: "OpenBadgeCredentialJwt",
                format: "jwt_vc_json",
                types: ["VerifiableCredential", "OpenBadgeCredential"],
                display: [
                    {
                        name: "Example University Degree",
                        description: "JFF Plugfest 3 OpenBadge (JWT)",
                        text_color: "#FFFFFF",
                        background_image: {
                            url: "https://avatars.githubusercontent.com/u/15343476",
                        },
                        logo: {
                            url: "https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/images/JFF_LogoLockup.png",
                            alt_text: "Red, magenta and yellow vertical lines with 3 black dots and the text JFF, depicting the Jobs For the Future logo."
                        }
                    },
                    {
                        locale: "en-US",
                        name: "Example University Degree",
                        description: "JFF Plugfest 3 OpenBadge (JWT)",
                        text_color: "#FFFFFF",
                        background_color: "#1763c1",
                        logo: {
                            url: "https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/images/JFF_LogoLockup.png",
                            alt_text: "Red, magenta and yellow vertical lines with 3 black dots and the text JFF, depicting the Jobs For the Future logo."
                        }
                    }
                ],
                cryptographic_binding_methods_supported: ["did:key"],
                cryptographic_suites_supported: ["EdDSA"]
            }
        ]
    };
    res.json(metadata);
});

// Credential Offer作成API
app.post('/api/create-offer', (req, res) => {
    try {
        const { firstName, lastName, email } = req.body;

        // Pre-authorized codeの生成
        const preAuthorizedCode = crypto.randomBytes(16).toString('hex');

        // ユーザー情報を保存
        userCredentials.set(preAuthorizedCode, {
            firstName,
            lastName,
            email,
            timestamp: Date.now()
        });

        // Pre-authorized codeを保存（有効期限: 10分）
        preAuthorizedCodes.set(preAuthorizedCode, {
            used: false,
            expires: Date.now() + 10 * 60 * 1000 // 10分
        });

        // Credential Offer作成
        const credentialOffer = {
            grants: {
                "urn:ietf:params:oauth:grant-type:pre-authorized_code": {
                    "pre-authorized_code": preAuthorizedCode,
                    "user_pin_required": false
                }
            },
            credentials: ["OpenBadgeCredential"],
            credential_issuer: baseUrl
        };

        // QRコード用のURL
        const qrCodeData = `openid-credential-offer://?credential_offer=${encodeURIComponent(JSON.stringify(credentialOffer))}`;

        res.json({
            credentialOffer,
            qrCodeData,
            preAuthorizedCode
        });

        console.log(`📋 Credential Offer作成: ${preAuthorizedCode} for ${firstName} ${lastName}`);

    } catch (error) {
        console.error('Error creating credential offer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Token Endpoint
app.post('/token', (req, res) => {
    try {
        const grant_type = req.body['grant_type'];
        const pre_authorized_code = req.body['pre-authorized_code'];
        const client_id = req.body['client_id'];

        console.log(`🔐 Token request: grant_type=${grant_type}, code=${pre_authorized_code}`);

        // Grant typeの検証
        if (grant_type !== 'urn:ietf:params:oauth:grant-type:pre-authorized_code') {
            return res.status(400).json({ error: 'unsupported_grant_type' });
        }

        // Pre-authorized codeの検証
        const codeData = preAuthorizedCodes.get(pre_authorized_code);
        if (!codeData) {
            return res.status(400).json({ error: 'invalid_grant' });
        }

        if (codeData.used) {
            return res.status(400).json({ error: 'invalid_grant', description: 'Code already used' });
        }

        if (Date.now() > codeData.expires) {
            preAuthorizedCodes.delete(pre_authorized_code);
            return res.status(400).json({ error: 'invalid_grant', description: 'Code expired' });
        }

        // コードを使用済みにマーク
        codeData.used = true;

        // Access tokenの生成
        const accessToken = crypto.randomBytes(32).toString('hex');
        const cNonce = uuidv4();

        // Access tokenを保存（有効期限: 5分）
        accessTokens.set(accessToken, {
            preAuthorizedCode: pre_authorized_code,
            cNonce,
            expires: Date.now() + 5 * 60 * 1000, // 5分
            issued: Date.now()
        });

        const tokenResponse = {
            access_token: accessToken,
            token_type: 'bearer',
            expires_in: 300,
            c_nonce: cNonce,
            c_nonce_expires_in: 300000
        };

        res.json(tokenResponse);
        console.log(`✅ Access token発行: ${accessToken.substring(0, 8)}...`);

    } catch (error) {
        console.error('Error issuing token:', error);
        res.status(500).json({ error: 'server_error' });
    }
});

// Credentials Endpoint
app.post('/credentials', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const { types, format, proof } = req.body;

        console.log(`🎯 Credential request: types=${JSON.stringify(types)}, format=${format}`);

        // Access tokenの検証
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'invalid_token' });
        }

        const accessToken = authHeader.substring(7);
        const tokenData = accessTokens.get(accessToken);

        if (!tokenData) {
            return res.status(401).json({ error: 'invalid_token' });
        }

        if (Date.now() > tokenData.expires) {
            accessTokens.delete(accessToken);
            return res.status(401).json({ error: 'invalid_token', description: 'Token expired' });
        }

        // ユーザー情報の取得
        const userData = userCredentials.get(tokenData.preAuthorizedCode);
        if (!userData) {
            return res.status(400).json({ error: 'invalid_request', description: 'User data not found' });
        }

        // Verifiable Credentialの作成
        const credentialId = uuidv4();
        const achievementId = `urn:uuid:${uuidv4()}`;
        const now = new Date();
        const issuanceDate = now.toISOString();
        const afterOneYear = Date.now() + 365 * 24 * 60 * 60 * 1000
        const expirationDate = new Date(afterOneYear).toISOString(); // 1年後

        // JWT用のタイムスタンプ（Unix timestamp seconds）
        const exp = Math.floor(afterOneYear / 1000); // 1年後（秒）
        const nbf = Math.floor(Date.now() / 1000); // 現在時刻（秒）

        const credential = {
            "@context": [
                "https://www.w3.org/2018/credentials/v1",
                "https://purl.imsglobal.org/spec/ob/v3p0/context.json"
            ],
            "type": ["VerifiableCredential", "OpenBadgeCredential"],
            "issuer": {
                "type": ["Profile"],
                "id": didJwk,
                "name": "Jobs for the Future (JFF)",
                "url": "https://www.jff.org/",
                "image": "https://w3c-ccg.github.io/vc-ed/plugfest-1-2022/images/JFF_LogoLockup.png"
            },
            "issuanceDate": issuanceDate,
            "expirationDate": expirationDate,
            "name": "JFF x vc-edu PlugFest 3 Interoperability",
            "credentialSubject": {
                "type": ["AchievementSubject"],
                "id": `did:example:${crypto.randomBytes(16).toString('hex')}`,
                "achievement": {
                    "id": achievementId,
                    "type": ["Achievement"],
                    "name": "JFF x vc-edu PlugFest 3 Interoperability",
                    "description": "This wallet supports the use of W3C Verifiable Credentials and has demonstrated interoperability during the presentation request workflow during JFF x VC-EDU PlugFest 3.",
                    "criteria": {
                        "type": "Criteria",
                        "narrative": "Wallet solutions providers earned this badge by demonstrating interoperability during the presentation request workflow. This includes successfully receiving a presentation request, allowing the holder to select at least two types of verifiable credentials to create a verifiable presentation, returning the presentation to the requestor, and passing verification of the presentation and the included credentials."
                    },
                    "image": {
                        "id": "https://w3c-ccg.github.io/vc-ed/plugfest-3-2023/images/JFF-VC-EDU-PLUGFEST3-badge-image.png",
                        "type": "Image"
                    }
                }
            }
        };

        // JWTペイロードの作成（記事の例に合わせて統一された形式で）
        const jwtPayload = {
            "vc": credential,
            "@context": credential["@context"],
            "type": credential.type,
            "expirationDate": expirationDate,
            "name": credential.name,
            "issuer": credential.issuer,
            "credentialSubject": credential.credentialSubject,
            "issuanceDate": issuanceDate,
            "sub": credential.credentialSubject.id,
            "nbf": nbf,
            "exp": exp,
            "iss": didJwk
        };

        // JWTとしてCredentialに署名
        const jwt = await new SignJWT(jwtPayload)
            .setProtectedHeader({
                alg: 'ES256K',
                typ: 'JWT',
                kid: didJwk + '#0'
            })
            .setIssuedAt()
            .setIssuer(didJwk)
            .sign(keyPair.privateKey);

        // Access tokenを削除（使用済み）
        accessTokens.delete(accessToken);

        const response = {
            credential: jwt,
            format: 'jwt_vc_json',
            c_nonce: uuidv4(),
            c_nonce_expires_in: 300000
        };

        res.json(response);
        console.log(`🎓 VC発行完了: ${userData.firstName} ${userData.lastName} (${userData.email})`);

    } catch (error) {
        console.error('Error issuing credential:', error);
        res.status(500).json({ error: 'server_error' });
    }
});

// DID Document endpoint (オプショナル)
app.get('/did.json', (req, res) => {
    if (!didJwk) {
        return res.status(500).json({ error: 'Keys not initialized' });
    }

    const didDocument = {
        "@context": [
            "https://www.w3.org/ns/did/v1",
            "https://w3id.org/security/suites/jws-2020/v1"
        ],
        "id": didJwk,
        "verificationMethod": [
            {
                "id": didJwk + "#0",
                "type": "JsonWebKey2020",
                "controller": didJwk,
                "publicKeyJwk": publicKeyJWK
            }
        ],
        "assertionMethod": [didJwk + "#0"],
        "authentication": [didJwk + "#0"],
        "capabilityInvocation": [didJwk + "#0"],
        "capabilityDelegation": [didJwk + "#0"]
    };

    res.json(didDocument);
});

// エラーハンドリング
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// サーバー起動
async function startServer() {
    try {
        await initializeKeys();

        app.listen(PORT, () => {
            console.log(`\n🚀 OpenID4VCI Demo Server started!`);
            console.log(`📱 Web UI: ${baseUrl}`);
            console.log(`🔍 Issuer Metadata: ${baseUrl}/.well-known/openid-credential-issuer`);
            console.log(`🎯 Token Endpoint: ${baseUrl}/token`);
            console.log(`🎓 Credentials Endpoint: ${baseUrl}/credentials`);
            console.log(`\n📖 使用方法:`);
            console.log(`1. ブラウザで ${baseUrl} にアクセス`);
            console.log(`2. フォームに情報を入力してQRコードを生成`);
            console.log(`3. Sphereon WalletまたはOpenID4VCI対応ウォレットでQRコードをスキャン`);
            console.log(`4. Verifiable Credentialがウォレットに発行されます\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

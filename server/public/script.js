// Digital Credentials API テスト用JavaScript

class DigitalCredentialsTest {
    constructor() {
        this.init();
    }

    init() {
        this.checkBrowserSupport();
        this.setupEventListeners();
        this.updateStatus('準備完了');
    }

    // ブラウザサポートをチェック
    checkBrowserSupport() {
        const supportDiv = document.getElementById('browserSupport');
        let supportStatus = '';

        // Digital Credentials APIのサポートをチェック
        if ('credentials' in navigator) {
            supportStatus += '✅ Credential Management API: サポート済み<br>';

            // Digital Credentials APIの具体的なサポートをチェック
            if (navigator.credentials && typeof navigator.credentials.get === 'function') {
                supportStatus += '✅ navigator.credentials.get: 利用可能<br>';
            } else {
                supportStatus += '❌ navigator.credentials.get: 利用不可<br>';
            }

            if (navigator.identity && typeof navigator.identity.get === 'function') {
                supportStatus += '✅ navigator.identity.get: 利用可能<br>';
            } else {
                supportStatus += '❌ navigator.identity.get: 利用不可<br>';
            }
        } else {
            supportStatus += '❌ Credential Management API: サポートされていません<br>';
        }

        // WebKitの特定機能をチェック
        if ('PublicKeyCredential' in window) {
            supportStatus += '✅ PublicKeyCredential: サポート済み<br>';
        } else {
            supportStatus += '❌ PublicKeyCredential: サポートされていません<br>';
        }

        // ユーザーエージェントの確認
        const userAgent = navigator.userAgent;
        supportStatus += `<br><strong>ユーザーエージェント:</strong><br>${userAgent}`;

        supportDiv.innerHTML = supportStatus;
    }

    // イベントリスナーの設定
    setupEventListeners() {
        const verifyBtn = document.getElementById('verifyIdentityBtn');
        const driverLicenseBtn = document.getElementById('requestDriverLicenseBtn');
        const orgIsoMdocBtn = document.getElementById('requestOrgIsoMdocBtn');

        verifyBtn.addEventListener('click', () => this.verifyIdentity());
        if (driverLicenseBtn) {
            driverLicenseBtn.addEventListener('click', () => this.requestDriverLicense());
        }
        if (orgIsoMdocBtn) {
            orgIsoMdocBtn.addEventListener('click', () => this.requestOrgIsoMdoc());
        }
    }

    // ステータス更新
    updateStatus(message) {
        const statusDiv = document.getElementById('status');
        statusDiv.innerHTML = `<p>ステータス: ${message}</p>`;
    }

    // 結果表示
    showResult(result) {
        const resultDiv = document.getElementById('result');
        const resultContent = document.getElementById('resultContent');

        resultContent.textContent = JSON.stringify(result, null, 2);
        resultDiv.style.display = 'block';
    }

    // 基本的な身元確認
    async verifyIdentity() {
        this.updateStatus('身元確認を実行中...');

        try {
            // Digital Credentials APIの基本的な使用例
            if (!navigator.credentials) {
                throw new Error('Credential Management APIがサポートされていません');
            }

            const request = {
                mediation: "required",
                digital: {
                    requests: [{
                        protocol: 'openid4vp-v1-unsigned',
                        data: {
                            "client_metadata": {
                                "vp_formats_supported": {
                                    "mso_mdoc": {
                                        "deviceauth_alg_values": [
                                            -7
                                        ],
                                        "issuerauth_alg_values": [
                                            -7
                                        ]
                                    }
                                }
                            },
                            "dcql_query": {
                                "credentials": [
                                    {
                                        "claims": [
                                            {
                                                "path": [
                                                    "org.iso.18013.5.1",
                                                    "family_name"
                                                ]
                                            },
                                            {
                                                "path": [
                                                    "org.iso.18013.5.1",
                                                    "given_name"
                                                ]
                                            },
                                            {
                                                "path": [
                                                    "org.iso.18013.5.1",
                                                    "age_over_21"
                                                ]
                                            }
                                        ],
                                        "format": "mso_mdoc",
                                        "id": "cred1",
                                        "meta": {
                                            "doctype_value": "org.iso.18013.5.1.mDL"
                                        }
                                    }
                                ]
                            },
                            "nonce": "PRFP7yWFovqz7T2lF_bJ-1khEKRLXm74TvY7AGDatRY",
                            "response_mode": "dc_api",
                            "response_type": "vp_token"
                        }
                    }
                    ]
                }
            };

            const credential = await navigator.credentials.get(request);

            this.updateStatus('身元確認完了');
            this.showResult({
                success: true,
                credential: credential,
                message: '身元確認が正常に完了しました'
            });

        } catch (error) {
            console.error('身元確認エラー:', error);
            this.updateStatus(`エラー: ${error.message}`);
            this.showResult({
                success: false,
                error: error.message,
                details: error.toString()
            });
        }
    }

    // org-iso-mdoc プロトコルを使用した身元確認
    async requestOrgIsoMdoc() {
        this.updateStatus('org-iso-mdoc による身元確認を実行中...');

        try {
            // Digital Credentials APIの基本的な使用例
            if (!navigator.credentials) {
                throw new Error('Credential Management APIがサポートされていません');
            }

            const mdocRequest = {
                // {
                //   "docType": "org.iso.18013.5.1.mDL",
                //   "nameSpaces": {
                //     "org.iso.18013.5.1": {
                //       "portrait": true,
                //       "given_name": true,
                //       "age_over_21": false,
                //       "family_name": true
                //     }
                //   }
                // }
                "deviceRequest": "pGd2ZXJzaW9uYzEuMWtkb2NSZXF1ZXN0c4GhbGl0ZW1zUmVxdWVzdNgYWG6iZ2RvY1R5cGV1b3JnLmlzby4xODAxMy41LjEubURMam5hbWVTcGFjZXOhcW9yZy5pc28uMTgwMTMuNS4xpGhwb3J0cmFpdPVqZ2l2ZW5fbmFtZfVrYWdlX292ZXJfMjH0a2ZhbWlseV9uYW1l9W1yZWFkZXJBdXRoQWxngYRDoQEmoRghWQF9MIIBeTCCASACCQCdvhptTdV7cDAKBggqhkjOPQQDAjBFMRowGAYDVQQKDBFUZXN0IE9yZ2FuaXphdGlvbjEnMCUGA1UEAwweVGVzdCBSZXF1ZXN0IEF1dGhlbnRpY2F0aW9uIENBMB4XDTI1MDUyNzIwNDgwMFoXDTM1MDUyNTIwNDgwMFowRTEaMBgGA1UECgwRVGVzdCBPcmdhbml6YXRpb24xJzAlBgNVBAMMHlRlc3QgUmVxdWVzdCBBdXRoZW50aWNhdGlvbiBDQTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABIt9TGoAW2u25Yi_Czptq21xNUqolJdfvpBDRVBYdMXSsdwxsbl2JH3gF3YiP6VldwYI0UxF0-CtkgUCoJ-LjaMwCgYIKoZIzj0EAwIDRwAwRAIgR8Pa4-6_xvHi5m7SLckA0QmdjVhUEzeam_SHkpmM4AECIH5H7lgKOw0C0mFIvgGG8cyS7IUuk6wGIsmc7JjtX9em9lhApChXUdkLtAgRXpmq_RGHLXpfazSUYQ3mi5nXDYw73R9yqw_gyOSDvxpjwEeSKkHEdYt777Wu8OskvwjqAiPahXFkZXZpY2VSZXF1ZXN0SW5mb9gYWCehaHVzZUNhc2VzgaJpbWFuZGF0b3J59Wxkb2N1bWVudFNldHOBgQA",

                // [
                //   "dcapi",
                //   {
                //     "nonce": {
                //       "type": "Buffer",
                //       "data": [
                //         249,
                //         111,
                //         231,
                //         78,
                //         89,
                //         43,
                //         118,
                //         61,
                //         221,
                //         150,
                //         97,
                //         59,
                //         229,
                //         162,
                //         224,
                //         122,
                //         170,
                //         29,
                //         97,
                //         226,
                //         178,
                //         106,
                //         222,
                //         132,
                //         123,
                //         70,
                //         180,
                //         220,
                //         119,
                //         127,
                //         19,
                //         177
                //       ]
                //     },
                //     "recipientPublicKey": {}
                //   }
                // ]
                "encryptionInfo": "gmVkY2FwaaJlbm9uY2VYIPlv505ZK3Y93ZZhO-Wi4HqqHWHismrehHtGtNx3fxOxcnJlY2lwaWVudFB1YmxpY0tleaQBAiABIVggrlztqHsaR_OK3Npf8eTvG6AZWNxJsb69ZTFIPJcUR-0iWCCbWR3FyNPy2ysLKoiTysxI7LjxvcRnfNsB-JLDNmZdDw"
            }

            const request = {
                mediation: "required",
                digital: {
                    requests: [{
                        protocol: "org-iso-mdoc",
                        data: mdocRequest
                    }]
                }
            };

            const credential = await navigator.credentials.get(request);

            this.updateStatus('org-iso-mdoc による身元確認完了');
            this.showResult({
                success: true,
                credential: credential,
                message: 'org-iso-mdoc プロトコルによる身元確認が正常に完了しました'
            });

        } catch (error) {
            console.error('org-iso-mdoc 身元確認エラー:', error);
            this.updateStatus(`エラー: ${error.message}`);
            this.showResult({
                success: false,
                error: error.message,
                details: error.toString()
            });
        }
    }
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
    new DigitalCredentialsTest();
});

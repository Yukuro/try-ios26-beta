const cbor = require('cbor');
const base64 = require('base64-js');

// デバイスリクエストをデコードする関数
function decodeDeviceRequest(deviceRequestBase64) {
    try {
        // Base64文字列をデコードしてバイナリデータを取得
        let base64Data = deviceRequestBase64.replace(/-/g, '+').replace(/_/g, '/');
        
        // Base64パディングを追加（長さが4の倍数になるまで）
        while (base64Data.length % 4) {
            base64Data += '=';
        }
        
        const binaryData = base64.toByteArray(base64Data);

        // CBORデータをデコード
        const decoded = cbor.decodeFirstSync(binaryData);

        console.log('デコードされたデバイスリクエスト:');
        console.log(JSON.stringify(decoded, null, 2));

        // docRequestsを取得
        if (decoded.docRequests && decoded.docRequests.length > 0) {
            console.log('\ndocRequests[0]の内容:');
            const docRequest = decoded.docRequests[0];
            console.log(JSON.stringify(docRequest, null, 2));

            // itemsRequestがある場合は処理
            if (docRequest.itemsRequest) {
                console.log('\nitemsRequestの内容:');
                const itemsRequestBytes = docRequest.itemsRequest.value;
                const itemsRequest = cbor.decodeFirstSync(itemsRequestBytes);
                console.log(JSON.stringify(itemsRequest, null, 2));

                // docTypeとnameSpacesを抽出
                console.log('\ndocType:', itemsRequest.docType);
                console.log('\nnameSpacesの内容:');
                if (itemsRequest.nameSpaces) {
                    for (const [namespaceName, elements] of Object.entries(itemsRequest.nameSpaces)) {
                        console.log(`Namespace: ${namespaceName}`);
                        for (const [elementName, intentToRetain] of Object.entries(elements)) {
                            console.log(`  - ${elementName}: ${intentToRetain}`);
                        }
                    }
                }
            }
        }

        return decoded;
    } catch (error) {
        console.error('デコードエラー:', error);
        return null;
    }
}

// コマンドライン引数からデバイスリクエストを取得
const deviceRequest = process.argv[2] || 'pGd2ZXJzaW9uYzEuMWtkb2NSZXF1ZXN0c4GhbGl0ZW1zUmVxdWVzdNgYWG6iZ2RvY1R5cGV1b3JnLmlzby4xODAxMy41LjEubURMam5hbWVTcGFjZXOhcW9yZy5pc28uMTgwMTMuNS4xpGhwb3J0cmFpdPVqZ2l2ZW5fbmFtZfVrYWdlX292ZXJfMjH0a2ZhbWlseV9uYW1l9W1yZWFkZXJBdXRoQWxngYRDoQEmoRghWQF9MIIBeTCCASACCQCdvhptTdV7cDAKBggqhkjOPQQDAjBFMRowGAYDVQQKDBFUZXN0IE9yZ2FuaXphdGlvbjEnMCUGA1UEAwweVGVzdCBSZXF1ZXN0IEF1dGhlbnRpY2F0aW9uIENBMB4XDTI1MDUyNzIwNDgwMFoXDTM1MDUyNTIwNDgwMFowRTEaMBgGA1UECgwRVGVzdCBPcmdhbml6YXRpb24xJzAlBgNVBAMMHlRlc3QgUmVxdWVzdCBBdXRoZW50aWNhdGlvbiBDQTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABIt9TGoAW2u25Yi_Czptq21xNUqolJdfvpBDRVBYdMXSsdwxsbl2JH3gF3YiP6VldwYI0UxF0-CtkgUCoJ-LjaMwCgYIKoZIzj0EAwIDRwAwRAIgR8Pa4-6_xvHi5m7SLckA0QmdjVhUEzeam_SHkpmM4AECIH5H7lgKOw0C0mFIvgGG8cyS7IUuk6wGIsmc7JjtX9em9lhApChXUdkLtAgRXpmq_RGHLXpfazSUYQ3mi5nXDYw73R9yqw_gyOSDvxpjwEeSKkHEdYt777Wu8OskvwjqAiPahXFkZXZpY2VSZXF1ZXN0SW5mb9gYWCehaHVzZUNhc2VzgaJpbWFuZGF0b3J59Wxkb2N1bWVudFNldHOBgQA';

// デバイスリクエストをデコード
decodeDeviceRequest(deviceRequest);

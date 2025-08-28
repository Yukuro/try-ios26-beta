const express = require('express');
const path = require('path');

const app = express();

// 静的ファイルの配信
app.use(express.static(path.join(__dirname, 'public')));

// メインページ
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Vercel用のエクスポート
module.exports = app;

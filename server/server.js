const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080;

// 静的ファイルの配信
app.use(express.static(path.join(__dirname, 'public')));

// メインページ
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

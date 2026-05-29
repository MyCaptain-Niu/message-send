const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const os = require('os');

const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 100;
const MAX_PAYLOAD = Math.ceil(MAX_FILE_SIZE_MB * 1.5 * 1024 * 1024); // base64 膨胀 + JSON 开销

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, maxPayload: MAX_PAYLOAD });

app.use(express.json({ limit: `${Math.ceil(MAX_FILE_SIZE_MB * 1.5)}mb` }));

let computerClients = new Set();
let mobileClients = new Set();

wss.on('connection', (ws, req) => {
    const clientType = req.url === '/mobile' ? 'mobile' : 'computer';

    if (clientType === 'computer') {
        computerClients.add(ws);
        console.log(`电脑端已连接 (总数: ${computerClients.size})`);
    } else {
        mobileClients.add(ws);
        console.log(`手机端已连接 (总数: ${mobileClients.size})`);
    }

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            const targets = clientType === 'mobile' ? computerClients : mobileClients;
            const senderLabel = clientType === 'mobile' ? '手机' : '电脑';
            const targetLabel = clientType === 'mobile' ? '电脑' : '手机';

            if (data.type === 'text' && typeof data.content === 'string' && data.content.trim()) {
                const msgPayload = JSON.stringify({
                    type: 'text',
                    content: data.content.trim(),
                    html: typeof data.html === 'string' ? data.html : undefined
                });
                broadcast(targets, msgPayload);
                console.log(`${senderLabel}→${targetLabel} 文本: ${data.content.trim().substring(0, 40)}`);
                safeSend(ws, { type: 'ack', status: 'ok' });

            } else if ((data.type === 'image' || data.type === 'file') && data.content) {
                const payload = {
                    type: data.type,
                    content: data.content,
                    filename: data.filename || (data.type === 'image' ? 'image.png' : 'file'),
                    mimeType: data.mimeType || (data.type === 'image' ? 'image/png' : 'application/octet-stream'),
                    size: data.size || 0
                };
                broadcast(targets, JSON.stringify(payload));
                const sizeKB = ((data.size || 0) / 1024).toFixed(1);
                console.log(`${senderLabel}→${targetLabel} ${data.type}: ${payload.filename} (${sizeKB}KB)`);
                safeSend(ws, { type: 'ack', status: 'ok' });
            }
        } catch (err) {
            console.error('消息解析失败', err);
        }
    });

    ws.on('close', () => {
        if (clientType === 'computer') {
            computerClients.delete(ws);
            console.log(`电脑端断开 (剩余: ${computerClients.size})`);
        } else {
            mobileClients.delete(ws);
            console.log(`手机端断开 (剩余: ${mobileClients.size})`);
        }
    });

    ws.on('error', (err) => {
        console.error('WebSocket 错误:', err.message);
    });

    safeSend(ws, { type: 'system', content: '已连接服务器', maxFileSizeMB: MAX_FILE_SIZE_MB });
});

function broadcast(clients, payload) {
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}

function safeSend(ws, data) {
    try {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    } catch (e) {
        // ignore
    }
}

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (let name of Object.keys(interfaces)) {
        for (let iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const PORT = 3000;
const LOCAL_IP = getLocalIP();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'computer.html'));
});

app.get('/mobile', (req, res) => {
    res.sendFile(path.join(__dirname, 'mobile.html'));
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║   📲 手机扫码传文本/文件服务已启动           ║
╠═══════════════════════════════════════════════╣
║   电脑端: http://${LOCAL_IP}:${PORT}              ║
║   手机端: http://${LOCAL_IP}:${PORT}/mobile       ║
║   文件限制: ${MAX_FILE_SIZE_MB}MB                   ║
║   支持: 文本 | 图片 | 文件 | 双向传输       ║
╚═══════════════════════════════════════════════╝
    `);
});

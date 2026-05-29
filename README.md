# 手机扫码传文本/文件

一个简单的跨设备文本、图片和文件传输工具。通过扫描二维码，实现手机与电脑之间的双向实时传输。

## 功能特性

- 📱 **双向传输**：手机和电脑之间可以互相发送文本、图片和文件
- 📷 **扫码连接**：电脑端显示二维码，手机扫码即可连接
- 🔄 **实时同步**：基于 WebSocket 的实时通信
- 📋 **自动复制**：收到的文本内容会自动复制到剪贴板
- 📄 **文件传输**：支持图片和任意类型文件的传输
- 💬 **聊天界面**：消息以聊天气泡形式展示，清晰易读
- 🌐 **局域网传输**：无需登录，无需云端，同一 Wi-Fi 下即可使用

## 系统要求

- Node.js 14 或更高版本
- 手机与电脑需要在同一个局域网（Wi-Fi）下

## 安装

1. 克隆或下载本项目
2. 安装依赖：

```bash
npm install
```

## 使用方法

### 启动服务

```bash
npm start
```

服务启动后，控制台会显示访问地址：

```
╔═══════════════════════════════════════════════╗
║   📲 手机扫码传文本/文件服务已启动           ║
╠═══════════════════════════════════════════════╣
║   电脑端: http://192.168.1.xxx:3000          ║
║   手机端: http://192.168.1.xxx:3000/mobile   ║
║   文件限制: 100MB                            ║
║   支持: 文本 | 图片 | 文件 | 双向传输       ║
╚═══════════════════════════════════════════════╝
```

### 使用 Docker 启动

构建镜像：

```bash
docker build -t phone-to-pc-text .
```

启动容器：

```bash
docker run --rm -p 3000:3000 phone-to-pc-text
```

如需修改文件大小限制，可以通过环境变量传入：

```bash
docker run --rm -p 3000:3000 -e MAX_FILE_SIZE_MB=50 phone-to-pc-text
```

容器启动后，在浏览器访问 `http://localhost:3000`。如果手机需要扫码连接，请确保手机和运行 Docker 的电脑在同一局域网内，并使用电脑的局域网 IP 地址访问。

### 电脑端使用

1. 在浏览器中打开电脑端地址（如 `http://192.168.1.xxx:3000`）
2. 页面会显示一个二维码
3. 等待手机扫码连接
4. 连接成功后，可以：
   - 在输入框输入文字发送给手机
   - 点击附件图标选择文件/图片发送给手机
   - 查看来自手机的消息历史

### 手机端使用

1. 使用微信、浏览器或任何扫码应用扫描电脑端二维码
2. 进入手机端页面
3. 连接成功后，可以：
   - 在输入框输入文字发送给电脑
   - 点击附件图标选择文件/图片发送给电脑
   - 查看来自电脑的消息历史
   - 下载收到的文件

## 配置选项

### 修改端口号

修改 `server.js` 中的 `PORT` 变量：

```javascript
const PORT = 3000; // 改为你想要的端口
```

### 修改文件大小限制

默认文件大小限制为 100MB。可以通过环境变量修改：

```bash
# Linux/Mac
MAX_FILE_SIZE_MB=50 npm start

# Windows CMD
set MAX_FILE_SIZE_MB=50 && npm start

# Windows PowerShell
$env:MAX_FILE_SIZE_MB="50"; npm start
```

## 技术栈

- **后端**：Node.js + Express
- **实时通信**：WebSocket (ws)
- **前端**：原生 HTML/CSS/JavaScript
- **二维码生成**：qrcodejs2 (CDN)

## 项目结构

```
phone-to-pc-text/
├── .dockerignore  # Docker 构建忽略规则，避免打包本地依赖和缓存
├── .gitignore     # Git 忽略规则，排除依赖、日志和本地配置
├── Dockerfile     # Docker 镜像构建文件
├── server.js      # 后端服务器，处理 WebSocket 连接和消息转发
├── computer.html  # 电脑端页面，显示二维码和聊天界面
├── mobile.html    # 手机端页面，发送/接收消息界面
├── package.json   # 项目配置和依赖
└── README.md      # 项目文档
```

## 工作原理

1. 电脑端访问 `server.js` 启动的 HTTP 服务
2. 电脑端通过 WebSocket 连接到服务器（默认连接）
3. 手机端通过扫描二维码获取 URL，访问 `/mobile` 页面
4. 手机端通过 WebSocket 连接到服务器（`/mobile` 路径）
5. 服务器识别客户端类型（电脑端/手机端），并将消息双向转发
6. 消息以 JSON 格式传输，支持文本、图片（Base64）和文件（Base64）

## 消息格式

### 文本消息
```json
{
  "type": "text",
  "content": "消息内容"
}
```

### 图片消息
```json
{
  "type": "image",
  "content": "data:image/png;base64,iVBORw0KGgo...",
  "filename": "image.png",
  "mimeType": "image/png",
  "size": 12345
}
```

### 文件消息
```json
{
  "type": "file",
  "content": "data:application/pdf;base64,JVBERi...",
  "filename": "document.pdf",
  "mimeType": "application/pdf",
  "size": 123456
}
```

## 注意事项

1. **网络环境**：确保手机和电脑在同一个 Wi-Fi 网络下
2. **防火墙**：如果无法连接，请检查防火墙设置，确保端口 3000 开放
3. **文件大小**：默认限制 100MB，过大文件可能导致传输失败或内存溢出
4. **浏览器兼容性**：建议使用现代浏览器（Chrome、Firefox、Safari、Edge）
5. **HTTPS**：如果使用 HTTPS，WebSocket 会自动切换到 WSS 协议

## 常见问题

### Q: 扫码后手机无法连接？
A: 请确认：
- 手机和电脑是否在同一 Wi-Fi 下
- 电脑防火墙是否阻止了端口 3000
- 浏览器地址栏的 IP 地址是否正确（不要使用 localhost）

### Q: 收到的文本没有自动复制？
A: 这可能是浏览器权限问题，请检查浏览器是否允许访问剪贴板。

### Q: 大文件传输失败？
A: 可以通过环境变量 `MAX_FILE_SIZE_MB` 增加文件大小限制，但建议保持合理大小以避免内存问题。

### Q: 如何让外网设备也能连接？
A: 可以使用内网穿透工具（如 ngrok、frp）将本地服务映射到公网。

## License

MIT

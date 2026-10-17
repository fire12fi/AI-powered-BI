# AI-powered BI 前端

基于 React 19、Umi Max 4、Ant Design 5 和 ECharts 的智能分析界面。

请在当前目录安装依赖和运行，而不是外层 `front` 目录：

```bash
npm install
npm run dev
```

需要 Node.js 20+。开发访问地址为 `http://localhost:8000`，`/api` 默认代理至 `http://localhost:8080`，可通过启动时的 `BI_API_TARGET` 覆盖。

运行 `npm run build` 生成 `dist/`。生产环境需由 Web 服务器反向代理 `/api`，不要把 AI 或数据库凭据放进前端配置。

完整启动步骤、后端配置和当前限制见[仓库根目录 README](../../README.md)。

# AI-powered BI 后端

基于 Spring Boot 2.7.2、MyBatis Plus、MySQL、EasyExcel 和讯飞星火 spark4j 的服务。

完整功能介绍、环境变量、数据库初始化、前后端启动和部署说明见[仓库根目录 README](../../README.md)。

配置好数据库和星火环境变量后，在当前目录运行：

```bash
mvn spring-boot:run
```

默认端口为 `8080`，API 前缀为 `/api`，接口文档位于 `/api/doc.html`。数据库建表脚本为 `sql/create_table.sql`，只包含结构。

公共配置中不保存真实凭据；本地配置文件和 `.env` 不应提交。代码来源与致谢见根目录 README 和原有源码注释。

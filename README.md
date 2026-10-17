# AI-powered BI · 智能 BI 助手

基于 React、Spring Boot 和讯飞星火的智能数据分析项目。用户上传 Excel、填写分析目标并选择图表类型，后端将表格转换成文本，调用星火模型生成 ECharts 配置与分析结论，前端展示图表和结果。

## 功能

- 用户注册、登录、退出及基于 Session 的登录状态。
- 上传 Excel，填写分析目标、图表名称和图表类型。
- 同步调用讯飞星火 V4.0，生成图表配置和文字结论。
- 使用 ECharts 展示图表，并在数据库保存原始数据、图表配置和分析结果。
- 图表增删改查、当前用户图表分页查询，以及管理员权限校验。
- 保留用户管理、帖子及文件上传等模板接口；COS 文件上传需要另外配置。

## 技术栈与目录

后端使用 Spring Boot 2.7.2、MyBatis Plus、MySQL、EasyExcel 和 spark4j；前端使用 React 19、TypeScript、Umi Max 4、Ant Design 5 和 ECharts 6。

```text
backend/springboot-init-master/  Spring Boot 后端及 Maven 构建
  src/main/java/               控制器、业务逻辑、AI 调用、数据模型
  src/main/resources/          公共配置与 MyBatis 映射
  sql/                        数据库结构初始化脚本
front/BI-front/                实际前端应用（在这里安装和运行）
  config/                     路由、开发代理、OpenAPI 配置
  src/pages/Welcome.tsx       智能分析页面
  src/services/bi/            后端接口封装
front/package.json            原有外层依赖清单，不是前端启动入口
```

## 环境要求

- 推荐 JDK 17、Maven 3.8+。
- Node.js 20+，npm。
- MySQL 8，以及可调用星火 V4.0 的讯飞应用凭据。

Redis 自动配置在启动类中默认禁用；主要分析流程不依赖 Redis、Elasticsearch 或 COS。若启用模板的帖子搜索等额外功能，需自行配置相应服务。

## 本地启动

### 1. 初始化数据库

在 MySQL 客户端执行 `backend/springboot-init-master/sql/create_table.sql`。脚本仅包含数据库和表结构，不含用户记录或数据库导出数据。默认数据库名是 `bi`，可按环境修改。

### 2. 配置并启动后端

公共 YAML 只保留环境变量引用，不保存真实凭据。请通过 IDE、系统环境变量或部署平台设置：

| 变量 | 用途 |
| --- | --- |
| `DB_URL` | MySQL JDBC URL，例如 `jdbc:mysql://localhost:3306/bi` |
| `DB_USERNAME` | 数据库账号 |
| `DB_PASSWORD` | 数据库密码 |
| `XUNFEI_APP_ID` | 讯飞应用 ID |
| `XUNFEI_API_KEY` | 讯飞 API Key |
| `XUNFEI_API_SECRET` | 讯飞 API Secret |
| `SERVER_PORT` | 后端端口，默认 `8080` |
| `SPRING_PROFILES_ACTIVE` | 环境，默认 `dev` |

```bash
cd backend/springboot-init-master
mvn spring-boot:run
```

接口文档：[http://localhost:8080/api/doc.html](http://localhost:8080/api/doc.html)。

若习惯使用私有配置文件，可创建被忽略的 `application-local.yml`，并设置 `SPRING_PROFILES_ACTIVE=local`。不要把环境变量的真实值、私有 YAML 或 IDE 运行配置提交到仓库。Spring Boot 不会自动读取 `.env`。

### 3. 启动前端

```bash
cd front/BI-front
npm install
npm run dev
```

打开 [http://localhost:8000](http://localhost:8000)，注册并登录，再上传 `.xlsx` 文件进行分析。

前端使用同源 `/api` 请求；开发代理默认转发到 `http://localhost:8080`。如果后端地址不同，在启动前设置 `BI_API_TARGET`。OpenAPI 生成命令 `npm run openapi` 使用相同目标，需要后端运行。

## 构建与部署

```bash
# 后端：编译、编译测试源码并打包，跳过需要外部服务的测试
cd backend/springboot-init-master
mvn package -DskipTests

# 前端：在独立终端运行
cd front/BI-front
npm run build
```

后端产物为 `target/springboot-init-0.0.1-SNAPSHOT.jar`，前端产物为 `front/BI-front/dist/`。生产环境通过 Web 服务器将 `/api` 反向代理到后端；开发代理不会进入生产构建。AI 分析是同步请求，反向代理超时应覆盖模型响应时间。

生产环境可设置 `SPRING_PROFILES_ACTIVE=prod`；除基础凭据外，还需设置 `KNIFE4J_USERNAME`、`KNIFE4J_PASSWORD` 以保护接口文档。可选 COS 上传需要设置 `COS_ACCESS_KEY`、`COS_SECRET_KEY`、`COS_REGION`、`COS_BUCKET`，并按部署环境调整 `FileConstant.COS_HOST`。

现有集成测试会连接数据库、搜索或存储服务，AI 测试还会实际调用模型。不要直接对生产环境执行测试；`test` profile 使用独立的 `TEST_DB_URL`、`TEST_DB_USERNAME`、`TEST_DB_PASSWORD`。

## 数据与配置边界

- 仓库忽略本地 YAML、`.env`、IDE 配置、依赖目录、Umi 缓存、构建产物、私钥、日志和备份。
- 请求日志不打印请求参数，AI 日志不打印完整分析结果，SQL 日志默认关闭。
- 上传的数据会转换为文本并发送给讯飞星火，原始数据和生成结果会保存到数据库；分析页面也会将结果缓存到当前浏览器的 localStorage。使用真实业务数据前应确认其可发送给模型服务。
- 前端配置会进入浏览器，任何 AI 密钥、数据库密码都只能保存在后端环境中。

## 当前实现限制

- 前端文件选择器允许 CSV/XLS/XLSX，但后端解析器目前固定按 XLSX 读取；请使用 `.xlsx`。
- AI 分析采用同步调用，前端请求超时为 60 秒；图表实体中的状态字段不代表已实现异步任务队列。
- 分析结果缓存在浏览器；文件列表恢复后需要重新选择文件才能再次上传。
- 图表查询和部分模板接口的权限边界仍需在正式上线前结合业务完善。本项目尚未完成生产环境的全面安全审计。

## 致谢

项目基于程序员鱼皮的 Spring Boot 初始化模板与 Ant Design Pro 扩展，保留了源码中的原作者信息。星火 SDK 使用开源 spark4j。第三方代码和依赖的使用请遵守各自许可。

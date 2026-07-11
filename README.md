# 《地球项目事故调查报告》静态小说网站

这是《地球项目事故调查报告》的个人阅读与创作管理仓库。项目使用纯静态 HTML、CSS、JavaScript 和 JSON，不需要数据库、服务器或付费接口。GitHub Pages 负责网页发布，Gitee 公开仓库负责国内 Legado 数据镜像。

作品已开始正式连载，目前发布第001章《周一的杨氏模量》。原非正式测试章已经被正式章节替换，不计入小说连续性。

正式创作生产线包括统一章节模板、第一卷前五章写作任务书、连续性台账和发布门禁。当前 `publicationStage` 为 `serializing`，自动检查会禁止测试章混入正式目录，并核对每章维护档案。

## 固定地址

- 网站：`https://chenxz0303.github.io/earth-project-incident-report/`
- GitHub 主仓库：`https://github.com/chenxz0303/earth-project-incident-report`
- Gitee 国内镜像：`https://gitee.com/cxz0303/earth-project-incident-report`
- 国内书籍信息：`https://gitee.com/cxz0303/earth-project-incident-report/raw/main/data/book.json`
- 国内目录接口：`https://gitee.com/cxz0303/earth-project-incident-report/raw/main/data/catalog.json`
- 国内 Legado 书源：`https://gitee.com/cxz0303/earth-project-incident-report/raw/main/legado/book-source.json`

GitHub 是唯一主仓库；Gitee 是只读用途的国内镜像。日常修改先提交到 GitHub，再将同一个 `main` 分支同步到 Gitee，避免两个平台同时编辑导致内容互相覆盖。

## 如何启用 GitHub Pages

1. 打开仓库网页，进入 **Settings → Pages**。
2. 在 **Build and deployment** 的 Source 中选择 **GitHub Actions**。
3. 打开仓库的 **Actions** 页面。
4. 选择“测试并部署 GitHub Pages”，等待测试和部署都显示绿色对勾。
5. 回到 **Settings → Pages**，即可看到正式网站地址。

本仓库目前是公开仓库，GitHub Pages 与 Gitee Raw 数据都可以匿名读取。Legado 不需要登录 GitHub 或 Gitee。

## 如何获得网站地址

本项目已根据 GitHub 用户名 `chenxz0303` 和仓库名 `earth-project-incident-report` 自动生成：

`https://chenxz0303.github.io/earth-project-incident-report/`

如果以后修改 GitHub/Gitee 用户名或仓库名，需要同步修改：

- `legado/book-source.json` 中的 `bookSourceUrl`；
- `data/book.json` 与 `data/catalog.json` 中的 Gitee Raw 地址；
- `scripts/check-project.mjs` 中的 `expectedDataBase` 与 `expectedWebsiteBase`；
- 本 README 中列出的固定地址。

修改后运行 `npm test`，确认所有引用一致。

## 如何导入安卓“阅读/Legado”书源

1. 用手机浏览器打开下方 Gitee 国内书源地址，确认能看到 JSON 文本。
2. 在“阅读”App 中进入 **我的 → 书源管理**。
3. 选择右上角菜单中的 **网络导入**。
4. 输入：

   `https://gitee.com/cxz0303/earth-project-incident-report/raw/main/legado/book-source.json`

5. 确认导入“地球项目事故调查报告”。
6. 在发现页打开“个人书源”，或搜索完整书名。

这是本书专用书源，因此搜索接口固定返回本书。书源、目录和章节正文使用 Gitee Raw 地址，正常情况下在国内网络中不需要访问 GitHub Pages。作品网页仍部署在 GitHub Pages，因此打开网页本身时仍可能受网络环境影响，但不影响“阅读”App 拉取正文数据。

## 如何新增章节

章节采用独立 JSON 文件。建议按卷保存，例如：

`chapters/volume-01/chapter-002.json`

可复制测试章的字段结构，但正式章必须：

- 使用新的唯一 `id`，例如 `volume-01/chapter-002`；
- 将 `isTest` 改为 `false`；
- 将 `status` 改为 `canon`；
- `content` 中每个数组元素保存一个自然段；
- 标题、卷名和章节 ID 与目录完全一致。

写完后还必须更新章节摘要、时间线、人物状态、伏笔表和关键设定变化，具体清单见 `docs/创作要求.md`。

正式动笔前先使用：

- `docs/章节创作模板.md`：所有章节通用模板；
- `docs/第一卷前五章写作任务书.md`：前五章字数、信息和风格门禁；
- `docs/连续性台账.md`：权限、证据、人物已知信息和实际剧情状态；
- `docs/创作与发布流程.md`：从写作到网站和 Legado 发布的完整流程。

第一次正式发布时，必须删除非正式测试章，并把 `data/book.json` 中的 `publicationStage` 从 `planning` 改为 `serializing`。自动检查会禁止测试章与正式章同时存在。

## 如何更新目录

编辑 `data/catalog.json` 时，需要同时维护两处：

1. `volumes` 中相应卷的 `chapters`；
2. 顶层扁平的 `chapters`。

两处章节内容和顺序必须一致。每个章节条目包含：

```json
{
  "id": "volume-01/chapter-002",
  "title": "章节标题",
  "volumeId": "volume-01",
  "volumeTitle": "卷名",
  "contentUrl": "chapters/volume-01/chapter-002.json",
  "sourceUrl": "https://gitee.com/cxz0303/earth-project-incident-report/raw/main/chapters/volume-01/chapter-002.json",
  "pageUrl": "reader.html?chapter=volume-01/chapter-002",
  "isTest": false,
  "wordCount": 3500
}
```

然后更新 `data/book.json` 中的 `latestChapterTitle`、`latestChapterUrl` 和 `updatedAt`，运行：

```text
npm test
```

测试通过后再提交。推送到 GitHub `main` 分支会自动重新部署网站；随后把同一个提交推送到 Gitee，国内书源才会获取到最新目录和正文。

首次设置完成后，本地仓库会保留名为 `gitee` 的远程地址。更新镜像时运行：

```text
git push gitee main
```

如果 Gitee 要求验证身份，请使用 Gitee 的安全认证方式，不要把密码或私人令牌写进仓库文件。

## 首次正式发布时如何替换测试章

本项目已完成以下操作，此处保留为维护说明：

1. 用正式的 `chapters/volume-01/chapter-001.json` 替换测试内容。
2. 将 `data/catalog.json` 的卷内目录和顶层扁平目录同时改为正式章节。
3. 更新 `data/book.json` 的最新章节字段。
4. 删除 `docs/章节摘要.md` 中的非正式测试记录。
5. 将 `data/book.json` 的 `publicationStage` 改为 `serializing`。

## 书源无法加载时如何排查

按顺序检查：

1. 用手机浏览器打开 Gitee 国内书源地址，确认没有 404 或登录页面。
2. 分别打开 Gitee 上的 `data/book.json`、`data/catalog.json` 和章节 Raw 地址，确认能看到 JSON 文本。
3. 确认书源中的 `bookSourceUrl` 以 `/raw/main/` 结尾，且 Gitee 用户名和仓库名正确。
4. 确认 Gitee 镜像的 `main` 分支已经同步到 GitHub 主仓库的最新提交。
5. 在“阅读”中删除旧书源后重新网络导入，避免缓存旧规则。
6. 如果地址跳转到登录页，确认 Gitee 镜像仓库仍为公开，并且使用的是 `/raw/main/` 地址。
7. 在电脑上运行 `npm test`，修复报告的目录、链接或 JSON 错误。

## 目录说明

```text
├── index.html                 作品首页与目录
├── reader.html                章节阅读页
├── assets/                    样式和网页脚本
├── data/                      书籍信息与目录接口
├── chapters/                  独立章节 JSON
├── legado/book-source.json    安卓“阅读”书源
├── docs/                      六卷150章完整场景卡、人物、设定与维护档案
│   ├── 章节创作模板.md         单章通用写作与审查模板
│   ├── 第一卷前五章写作任务书.md 前五章执行级任务
│   ├── 连续性台账.md           权限、证据、人物知识与实际状态
│   └── 创作与发布流程.md       正文到双仓库发布闭环
├── scripts/check-project.mjs  一致性测试
└── .github/workflows/pages.yml 自动测试与部署
```

## 本地查看

由于网页会读取 JSON，不能直接双击 HTML 文件。可在仓库目录启动任意静态文件服务后访问首页；日常维护通常直接推送并使用 GitHub Pages 预览即可。

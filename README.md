# 《地球项目事故调查报告》静态小说网站

这是《地球项目事故调查报告》的个人阅读与创作管理仓库。项目使用纯静态 HTML、CSS、JavaScript 和 JSON，不需要数据库、服务器或付费接口，可通过 GitHub Pages 发布，并可导入安卓“阅读/Legado”App。

当前只包含一篇明确标记为“非正式正文”的测试章，用于验证网页和书源；尚未开始正式创作。

## 固定地址

- 网站：`https://chenxz0303.github.io/earth-project-incident-report/`
- 书籍信息：`https://chenxz0303.github.io/earth-project-incident-report/data/book.json`
- 目录接口：`https://chenxz0303.github.io/earth-project-incident-report/data/catalog.json`
- Legado 书源：`https://chenxz0303.github.io/earth-project-incident-report/legado/book-source.json`

以上地址在 GitHub Pages 第一次部署成功后生效。

## 如何启用 GitHub Pages

1. 打开仓库网页，进入 **Settings → Pages**。
2. 在 **Build and deployment** 的 Source 中选择 **GitHub Actions**。
3. 打开仓库的 **Actions** 页面。
4. 选择“测试并部署 GitHub Pages”，等待测试和部署都显示绿色对勾。
5. 回到 **Settings → Pages**，即可看到正式网站地址。

本仓库目前是私有仓库。GitHub 是否允许从私有仓库发布 Pages 取决于账号套餐与当前 GitHub 政策。如果 Pages 页面提示套餐不支持，请不要把仓库擅自改为公开；可升级支持私有仓库 Pages 的套餐，或日后确认后再选择其他发布方式。Legado 必须能匿名访问上述网站地址，不能读取需要 GitHub 登录的仓库文件。

## 如何获得网站地址

本项目已根据 GitHub 用户名 `chenxz0303` 和仓库名 `earth-project-incident-report` 自动生成：

`https://chenxz0303.github.io/earth-project-incident-report/`

如果以后修改用户名或仓库名，需要同步修改：

- `legado/book-source.json` 中的 `bookSourceUrl`；
- `scripts/check-project.mjs` 中的 `expectedBase`；
- 本 README 中列出的固定地址。

修改后运行 `npm test`，确认所有引用一致。

## 如何导入安卓“阅读/Legado”书源

1. 确认 GitHub Pages 已部署成功，并用手机浏览器打开书源地址。
2. 在“阅读”App 中进入 **我的 → 书源管理**。
3. 选择右上角菜单中的 **网络导入**。
4. 输入：

   `https://chenxz0303.github.io/earth-project-incident-report/legado/book-source.json`

5. 确认导入“地球项目事故调查报告”。
6. 在发现页打开“个人书源”，或搜索完整书名。

这是本书专用书源，因此搜索接口固定返回本书。正式使用前应先在浏览器中确认 `book.json`、`catalog.json` 和章节 JSON 均能直接打开。

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
  "sourceUrl": "https://chenxz0303.github.io/earth-project-incident-report/chapters/volume-01/chapter-002.json",
  "pageUrl": "reader.html?chapter=volume-01/chapter-002",
  "isTest": false,
  "wordCount": 3500
}
```

然后更新 `data/book.json` 中的 `latestChapterTitle`、`latestChapterUrl` 和 `updatedAt`，运行：

```text
npm test
```

测试通过后再提交。推送到 `main` 分支会自动重新部署网站。

## 如何删除测试章

1. 删除 `chapters/volume-01/chapter-001.json`。
2. 从 `data/catalog.json` 的卷内目录和顶层扁平目录删除该条目，或替换为正式章节。
3. 更新 `data/book.json` 的最新章节字段。
4. 删除 `docs/章节摘要.md` 中的非正式测试记录。
5. 正式章节存在后，需要相应调整测试脚本中“不得有正式正文”的阶段性限制。

## 书源无法加载时如何排查

按顺序检查：

1. 用手机浏览器打开网站地址，确认没有 404 或登录页面。
2. 分别打开 `data/book.json`、`data/catalog.json` 和章节 JSON，确认能看到文本。
3. 确认书源中的 `bookSourceUrl` 以 `/` 结尾，且用户名和仓库名正确。
4. 确认 GitHub Actions 最近一次部署为绿色对勾。
5. 在“阅读”中删除旧书源后重新网络导入，避免缓存旧规则。
6. 如果浏览器要求登录 GitHub，说明访问的是私有仓库文件而不是可匿名访问的 Pages 网站，Legado 无法使用这种地址。
7. 在电脑上运行 `npm test`，修复报告的目录、链接或 JSON 错误。

## 目录说明

```text
├── index.html                 作品首页与目录
├── reader.html                章节阅读页
├── assets/                    样式和网页脚本
├── data/                      书籍信息与目录接口
├── chapters/                  独立章节 JSON
├── legado/book-source.json    安卓“阅读”书源
├── docs/                      大纲、人物、设定和维护档案
├── scripts/check-project.mjs  一致性测试
└── .github/workflows/pages.yml 自动测试与部署
```

## 本地查看

由于网页会读取 JSON，不能直接双击 HTML 文件。可在仓库目录启动任意静态文件服务后访问首页；日常维护通常直接推送并使用 GitHub Pages 预览即可。

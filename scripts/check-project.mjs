import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const expectedDataBase = "https://gitee.com/cxz0303/earth-project-incident-report/raw/main/";
const expectedWebsiteBase = "https://chenxz0303.github.io/earth-project-incident-report/";
const errors = [];

const fail = (message) => errors.push(message);
const localPath = (url) => url.split(/[?#]/, 1)[0].replace(/^\.\//, "");
const exists = async (relativePath) => {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
};
const readJson = async (relativePath) => {
  try {
    return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
  } catch (error) {
    fail(`${relativePath} 不是有效 JSON：${error.message}`);
    return null;
  }
};

const book = await readJson("data/book.json");
const catalog = await readJson("data/catalog.json");
const sources = await readJson("legado/book-source.json");

if (book) {
  for (const key of ["id", "title", "author", "description", "catalogUrl", "bookInfoUrl"]) {
    if (!book[key]) fail(`data/book.json 缺少 ${key}`);
  }
  if (book.title !== "地球项目事故调查报告") fail("书名与项目约定不一致");
  if (book.author !== "陈默项目组") fail("作者显示名与项目约定不一致");
  if (!(await exists(book.catalogUrl))) fail(`书籍信息引用的目录不存在：${book.catalogUrl}`);
  if (book.bookInfoUrl !== `${expectedDataBase}data/book.json`) fail("书源书籍信息绝对地址错误");
  if (book.catalogSourceUrl !== `${expectedDataBase}data/catalog.json`) fail("书源目录绝对地址错误");
  if (book.websiteUrl !== expectedWebsiteBase) fail("作品网站地址错误");
}

if (catalog) {
  if (!Array.isArray(catalog.volumes) || !Array.isArray(catalog.chapters)) {
    fail("catalog.json 必须同时包含 volumes 和 chapters 数组");
  } else {
    const nested = catalog.volumes.flatMap((volume) => volume.chapters || []);
    const flatIds = catalog.chapters.map((chapter) => chapter.id);
    const nestedIds = nested.map((chapter) => chapter.id);
    if (new Set(flatIds).size !== flatIds.length) fail("扁平章节目录存在重复 id");
    if (JSON.stringify(flatIds) !== JSON.stringify(nestedIds)) fail("分卷目录与扁平章节目录顺序或内容不一致");

    for (const chapter of catalog.chapters) {
      if (!chapter.id || !chapter.title || !chapter.contentUrl || !chapter.pageUrl) {
        fail(`章节条目字段不完整：${JSON.stringify(chapter)}`);
        continue;
      }
      if (!(await exists(chapter.contentUrl))) {
        fail(`章节文件不存在：${chapter.contentUrl}`);
        continue;
      }
      if (!chapter.pageUrl.startsWith(`reader.html?chapter=${chapter.id}`)) {
        fail(`章节页面参数与 id 不一致：${chapter.pageUrl}`);
      }
      if (chapter.sourceUrl !== `${expectedDataBase}${chapter.contentUrl}`) {
        fail(`章节书源绝对地址与网页地址不一致：${chapter.id}`);
      }
      const content = await readJson(chapter.contentUrl);
      if (!content) continue;
      if (content.id !== chapter.id) fail(`${chapter.contentUrl} 的 id 与目录不一致`);
      if (content.title !== chapter.title) fail(`${chapter.contentUrl} 的标题与目录不一致`);
      if (!Array.isArray(content.content) || content.content.length === 0) fail(`${chapter.contentUrl} 没有正文段落数组`);
    }

    const testChapters = catalog.chapters.filter((chapter) => chapter.isTest);
    const formalChapters = catalog.chapters.filter((chapter) => !chapter.isTest);
    if (testChapters.length !== 1) fail(`当前阶段必须且只能有 1 篇测试章，实际为 ${testChapters.length}`);
    if (formalChapters.length !== 0) fail(`当前阶段不得生成正式正文，检测到 ${formalChapters.length} 篇`);

    const latest = catalog.chapters.at(-1);
    if (book && latest) {
      if (book.latestChapterTitle !== latest.title) fail("book.json 的最新章节标题与目录不一致");
      if (book.latestChapterUrl !== latest.contentUrl) fail("book.json 的最新章节地址与目录不一致");
    }
  }
}

if (!Array.isArray(sources) || sources.length !== 1) {
  fail("legado/book-source.json 必须是只含一个书源的数组");
} else {
  const source = sources[0];
  if (source.bookSourceUrl !== expectedDataBase) fail(`书源根地址错误，应为 ${expectedDataBase}`);
  if (source.searchUrl !== "data/book.json") fail("书源搜索地址未指向 book.json");
  if (!String(source.exploreUrl).endsWith("data/book.json")) fail("书源发现地址未指向 book.json");
  if (source.ruleBookInfo?.tocUrl !== "$.catalogSourceUrl") fail("书源书籍信息规则未获取绝对目录地址");
  if (source.ruleToc?.chapterList !== "$.chapters[*]") fail("书源目录规则未使用扁平章节列表");
  if (source.ruleToc?.chapterUrl !== "$.sourceUrl") fail("书源章节规则未读取绝对章节地址");
  if (source.ruleContent?.content !== "$.content[*]") fail("书源正文规则未读取章节段落");
}

for (const htmlFile of ["index.html", "reader.html"]) {
  const html = await readFile(path.join(root, htmlFile), "utf8");
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  for (const ref of refs) {
    if (/^(?:https?:|#|mailto:|data:)/.test(ref)) continue;
    const target = localPath(ref);
    if (target && !(await exists(target))) fail(`${htmlFile} 引用的文件不存在：${ref}`);
  }
}

if (!(await exists(".github/workflows/pages.yml"))) fail("缺少 GitHub Pages 工作流");
if (!(await exists("docs/项目说明书.md"))) fail("缺少项目说明书");

if (errors.length) {
  console.error("项目检查失败：");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("项目检查通过：JSON、目录、章节、页面链接和 Legado 书源引用一致。");

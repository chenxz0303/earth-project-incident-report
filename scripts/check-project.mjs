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
if (!(await exists("docs/章节规划.md"))) {
  fail("缺少 150 章章节规划");
} else {
  const chapterPlan = await readFile(path.join(root, "docs/章节规划.md"), "utf8");
  const plannedNumbers = [...chapterPlan.matchAll(/^\|\s*(\d{3})\s*\|/gm)].map((match) => Number(match[1]));
  const expectedNumbers = Array.from({ length: 150 }, (_, index) => index + 1);
  if (JSON.stringify(plannedNumbers) !== JSON.stringify(expectedNumbers)) {
    fail(`章节规划编号必须从 001 连续到 150，当前识别到 ${plannedNumbers.length} 章`);
  }
}
if (!(await exists("docs/第一卷前十章场景卡.md"))) {
  fail("缺少第一卷前十章场景卡");
} else {
  const sceneCards = await readFile(path.join(root, "docs/第一卷前十章场景卡.md"), "utf8");
  const sceneChapterNumbers = [...sceneCards.matchAll(/^## 第 (\d{3}) 章：/gm)].map((match) => Number(match[1]));
  const expectedSceneNumbers = Array.from({ length: 10 }, (_, index) => index + 1);
  if (JSON.stringify(sceneChapterNumbers) !== JSON.stringify(expectedSceneNumbers)) {
    fail(`前十章场景卡编号必须从 001 连续到 010，当前识别到 ${sceneChapterNumbers.length} 章`);
  }
}
if (!(await exists("docs/第一卷第十一至二十五章场景卡.md"))) {
  fail("缺少第一卷第 11—25 章场景卡");
} else {
  const laterSceneCards = await readFile(path.join(root, "docs/第一卷第十一至二十五章场景卡.md"), "utf8");
  const laterSceneNumbers = [...laterSceneCards.matchAll(/^## 第 (\d{3}) 章：/gm)].map((match) => Number(match[1]));
  const expectedLaterSceneNumbers = Array.from({ length: 15 }, (_, index) => index + 11);
  if (JSON.stringify(laterSceneNumbers) !== JSON.stringify(expectedLaterSceneNumbers)) {
    fail(`第一卷后 15 章场景卡编号必须从 011 连续到 025，当前识别到 ${laterSceneNumbers.length} 章`);
  }
}
if (!(await exists("docs/第二卷第二十六至三十八章场景卡.md"))) {
  fail("缺少第二卷第 26—38 章场景卡");
} else {
  const secondVolumeFirstCards = await readFile(path.join(root, "docs/第二卷第二十六至三十八章场景卡.md"), "utf8");
  const secondVolumeFirstNumbers = [...secondVolumeFirstCards.matchAll(/^## 第 (\d{3}) 章：/gm)].map((match) => Number(match[1]));
  const expectedSecondVolumeFirstNumbers = Array.from({ length: 13 }, (_, index) => index + 26);
  if (JSON.stringify(secondVolumeFirstNumbers) !== JSON.stringify(expectedSecondVolumeFirstNumbers)) {
    fail(`第二卷前 13 章场景卡编号必须从 026 连续到 038，当前识别到 ${secondVolumeFirstNumbers.length} 章`);
  }
}
if (!(await exists("docs/第二卷第三十九至五十章场景卡.md"))) {
  fail("缺少第二卷第 39—50 章场景卡");
} else {
  const secondVolumeLaterCards = await readFile(path.join(root, "docs/第二卷第三十九至五十章场景卡.md"), "utf8");
  const secondVolumeLaterNumbers = [...secondVolumeLaterCards.matchAll(/^## 第 (\d{3}) 章：/gm)].map((match) => Number(match[1]));
  const expectedSecondVolumeLaterNumbers = Array.from({ length: 12 }, (_, index) => index + 39);
  if (JSON.stringify(secondVolumeLaterNumbers) !== JSON.stringify(expectedSecondVolumeLaterNumbers)) {
    fail(`第二卷后 12 章场景卡编号必须从 039 连续到 050，当前识别到 ${secondVolumeLaterNumbers.length} 章`);
  }
}
if (!(await exists("docs/第三卷第五十一至六十三章场景卡.md"))) {
  fail("缺少第三卷第 51—63 章场景卡");
} else {
  const thirdVolumeFirstCards = await readFile(path.join(root, "docs/第三卷第五十一至六十三章场景卡.md"), "utf8");
  const thirdVolumeFirstNumbers = [...thirdVolumeFirstCards.matchAll(/^## 第 (\d{3}) 章：/gm)].map((match) => Number(match[1]));
  const expectedThirdVolumeFirstNumbers = Array.from({ length: 13 }, (_, index) => index + 51);
  if (JSON.stringify(thirdVolumeFirstNumbers) !== JSON.stringify(expectedThirdVolumeFirstNumbers)) {
    fail(`第三卷前 13 章场景卡编号必须从 051 连续到 063，当前识别到 ${thirdVolumeFirstNumbers.length} 章`);
  }
}
if (!(await exists("docs/第三卷第六十四至七十五章场景卡.md"))) {
  fail("缺少第三卷第 64—75 章场景卡");
} else {
  const thirdVolumeLaterCards = await readFile(path.join(root, "docs/第三卷第六十四至七十五章场景卡.md"), "utf8");
  const thirdVolumeLaterNumbers = [...thirdVolumeLaterCards.matchAll(/^## 第 (\d{3}) 章：/gm)].map((match) => Number(match[1]));
  const expectedThirdVolumeLaterNumbers = Array.from({ length: 12 }, (_, index) => index + 64);
  if (JSON.stringify(thirdVolumeLaterNumbers) !== JSON.stringify(expectedThirdVolumeLaterNumbers)) {
    fail(`第三卷后 12 章场景卡编号必须从 064 连续到 075，当前识别到 ${thirdVolumeLaterNumbers.length} 章`);
  }
}
if (!(await exists("docs/第四卷第七十六至一百章场景卡.md"))) {
  fail("缺少第四卷第 76—100 章场景卡");
} else {
  const fourthVolumeCards = await readFile(path.join(root, "docs/第四卷第七十六至一百章场景卡.md"), "utf8");
  const fourthVolumeNumbers = [...fourthVolumeCards.matchAll(/^\|\s*(\d{3})\s*\|/gm)].map((match) => Number(match[1]));
  const expectedFourthVolumeNumbers = Array.from({ length: 25 }, (_, index) => index + 76);
  if (JSON.stringify(fourthVolumeNumbers) !== JSON.stringify(expectedFourthVolumeNumbers)) {
    fail(`第四卷场景卡编号必须从 076 连续到 100，当前识别到 ${fourthVolumeNumbers.length} 章`);
  }
}
if (!(await exists("docs/第五卷第一百零一至一百二十五章场景卡.md"))) {
  fail("缺少第五卷第 101—125 章场景卡");
} else {
  const fifthVolumeCards = await readFile(path.join(root, "docs/第五卷第一百零一至一百二十五章场景卡.md"), "utf8");
  const fifthVolumeNumbers = [...fifthVolumeCards.matchAll(/^\|\s*(\d{3})\s*\|/gm)].map((match) => Number(match[1]));
  const expectedFifthVolumeNumbers = Array.from({ length: 25 }, (_, index) => index + 101);
  if (JSON.stringify(fifthVolumeNumbers) !== JSON.stringify(expectedFifthVolumeNumbers)) {
    fail(`第五卷场景卡编号必须从 101 连续到 125，当前识别到 ${fifthVolumeNumbers.length} 章`);
  }
}
if (!(await exists("docs/第六卷第一百二十六至一百五十章场景卡.md"))) {
  fail("缺少第六卷第 126—150 章场景卡");
} else {
  const sixthVolumeCards = await readFile(path.join(root, "docs/第六卷第一百二十六至一百五十章场景卡.md"), "utf8");
  const sixthVolumeNumbers = [...sixthVolumeCards.matchAll(/^\|\s*(\d{3})\s*\|/gm)].map((match) => Number(match[1]));
  const expectedSixthVolumeNumbers = Array.from({ length: 25 }, (_, index) => index + 126);
  if (JSON.stringify(sixthVolumeNumbers) !== JSON.stringify(expectedSixthVolumeNumbers)) {
    fail(`第六卷场景卡编号必须从 126 连续到 150，当前识别到 ${sixthVolumeNumbers.length} 章`);
  }
}

if (errors.length) {
  console.error("项目检查失败：");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("项目检查通过：JSON、目录、章节、页面链接和 Legado 书源引用一致。");

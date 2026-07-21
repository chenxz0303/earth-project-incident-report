import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const catalogPath = path.join(root, "data", "catalog.json");
const bookPath = path.join(root, "data", "book.json");

const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const book = JSON.parse(fs.readFileSync(bookPath, "utf8"));
const oldEntries = new Map((catalog.chapters ?? []).map((item) => [item.id, item]));
const volumeMeta = new Map((catalog.volumes ?? []).map((volume) => [volume.id, volume]));

const chapterFiles = [];
for (const volumeName of fs.readdirSync(path.join(root, "chapters"))) {
  const volumeDir = path.join(root, "chapters", volumeName);
  if (!fs.statSync(volumeDir).isDirectory()) continue;
  for (const fileName of fs.readdirSync(volumeDir)) {
    if (/^chapter-\d{3}\.json$/.test(fileName)) {
      chapterFiles.push(path.join(volumeDir, fileName));
    }
  }
}

const hanCount = (text) => (text.match(/[\u3400-\u4DBF\u4E00-\u9FFF]/g) ?? []).length;
const chapters = chapterFiles
  .map((filePath) => JSON.parse(fs.readFileSync(filePath, "utf8")))
  .filter((chapter) => chapter.status === "canon")
  .sort((a, b) => a.chapterNumber - b.chapterNumber)
  .map((chapter) => {
    const old = oldEntries.get(chapter.id) ?? {};
    const contentUrl = `chapters/${chapter.volumeId}/chapter-${String(chapter.chapterNumber).padStart(3, "0")}.json`;
    return {
      ...old,
      id: chapter.id,
      title: chapter.title,
      volumeId: chapter.volumeId,
      volumeTitle: chapter.volumeTitle,
      contentUrl,
      sourceUrl: `https://gitee.com/cxz0303/earth-project-incident-report/raw/main/${contentUrl}`,
      pageUrl: `reader.html?chapter=${chapter.id}`,
      isTest: false,
      wordCount: hanCount(chapter.content.join("")),
    };
  });

const grouped = new Map();
for (const chapter of chapters) {
  if (!grouped.has(chapter.volumeId)) grouped.set(chapter.volumeId, []);
  grouped.get(chapter.volumeId).push(chapter);
}

catalog.volumes = [...grouped.entries()].map(([volumeId, items]) => {
  const old = volumeMeta.get(volumeId) ?? {};
  return {
    ...old,
    id: volumeId,
    title: items[0].volumeTitle,
    chapters: items,
  };
});
catalog.chapters = chapters;
catalog.updatedAt = new Date().toISOString().slice(0, 10);

const latest = chapters.at(-1);
book.latestChapterTitle = latest.title;
book.latestChapterUrl = latest.contentUrl;
book.updatedAt = catalog.updatedAt;

fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
fs.writeFileSync(bookPath, `${JSON.stringify(book, null, 2)}\n`, "utf8");

console.log(`已同步 ${chapters.length} 章，最新为 ${latest.title}。`);

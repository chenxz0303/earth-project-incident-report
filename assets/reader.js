const readerEscape = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

const setNav = (element, chapter) => {
  if (!chapter) return;
  element.href = chapter.pageUrl;
  element.classList.remove("is-disabled");
  element.removeAttribute("aria-disabled");
};

async function loadChapter() {
  const article = document.querySelector("#chapter");
  const id = new URLSearchParams(location.search).get("chapter");
  if (!id || !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(id)) {
    article.innerHTML = '<p class="error">章节地址无效，请返回目录重新选择。</p>';
    return;
  }

  try {
    const catalogResponse = await fetch("data/catalog.json");
    if (!catalogResponse.ok) throw new Error("目录读取失败");
    const catalog = await catalogResponse.json();
    const index = catalog.chapters.findIndex((chapter) => chapter.id === id);
    if (index < 0) throw new Error("目录中不存在该章节");
    const catalogChapter = catalog.chapters[index];
    const chapterResponse = await fetch(catalogChapter.contentUrl);
    if (!chapterResponse.ok) throw new Error("章节文件读取失败");
    const chapter = await chapterResponse.json();

    document.title = `${chapter.title} · 地球项目事故调查报告`;
    article.innerHTML = `
      <header class="chapter-heading">
        ${chapter.isTest ? '<div class="test-badge">非正式正文 · 仅用于功能测试</div>' : ""}
        <p>${readerEscape(chapter.volumeTitle)}</p>
        <h1>${readerEscape(chapter.title)}</h1>
      </header>
      <div class="chapter-content">
        ${chapter.content.map((paragraph) => `<p>${readerEscape(paragraph)}</p>`).join("")}
      </div>
      ${chapter.isTest ? '<aside class="test-note">本章是网页与书源联调样本，可直接删除或替换，不计入正式正文和全书字数。</aside>' : ""}
    `;
    setNav(document.querySelector("#prev-chapter"), catalog.chapters[index - 1]);
    setNav(document.querySelector("#next-chapter"), catalog.chapters[index + 1]);
  } catch (error) {
    article.innerHTML = `<p class="error">章节暂时无法加载：${readerEscape(error.message)}</p>`;
  }
}

loadChapter();

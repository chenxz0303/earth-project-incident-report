const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

async function loadHome() {
  try {
    const [bookResponse, catalogResponse] = await Promise.all([
      fetch("data/book.json"),
      fetch("data/catalog.json")
    ]);
    if (!bookResponse.ok || !catalogResponse.ok) throw new Error("数据文件读取失败");

    const book = await bookResponse.json();
    const catalog = await catalogResponse.json();
    document.title = `${book.title} · ${book.author}`;
    document.querySelector("#book-title").textContent = book.title;
    document.querySelector("#book-author").textContent = `作者：${book.author}`;
    document.querySelector("#book-intro").textContent = book.description;
    document.querySelector("#book-meta").innerHTML = [
      `<span>${escapeHtml(book.status)}</span>`,
      `<span>${escapeHtml(book.targetWords)}</span>`,
      ...book.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`)
    ].join("");

    const chapterTotal = catalog.chapters.length;
    document.querySelector("#chapter-count").textContent = `${catalog.volumes.length} 卷 · ${chapterTotal} 章`;
    document.querySelector("#catalog").innerHTML = catalog.volumes.map((volume) => `
      <section class="volume-card">
        <div class="volume-heading">
          <div>
            <div class="volume-number">${escapeHtml(volume.id)}</div>
            <h3>${escapeHtml(volume.title)}</h3>
          </div>
          <span>${volume.chapters.length} 章</span>
        </div>
        <p class="volume-summary">${escapeHtml(volume.summary)}</p>
        <ol class="chapter-list">
          ${volume.chapters.map((chapter) => `
            <li>
              <a href="${escapeHtml(chapter.pageUrl)}">
                <span>${escapeHtml(chapter.title)}</span>
                ${chapter.isTest ? '<small>非正式测试</small>' : ""}
              </a>
            </li>
          `).join("")}
        </ol>
      </section>
    `).join("");
  } catch (error) {
    document.querySelector("#catalog").innerHTML = `<p class="error">目录暂时无法加载：${escapeHtml(error.message)}</p>`;
  }
}

loadHome();

async function loadCategories() {
  const grid = document.getElementById("categoryGrid");
  try {
    const folderQuery = encodeURIComponent(`'${GOOGLE_DRIVE_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
    const fileQuery = encodeURIComponent(`mimeType != 'application/vnd.google-apps.folder' and trashed = false`);

    const [catRes, noteRes] = await Promise.all([
      fetch(`https://googleapis.com{folderQuery}&fields=files(id,name)&orderBy=name&key=${GOOGLE_API_KEY}`),
      fetch(`https://googleapis.com{fileQuery}&fields=files(id,parents)&pageSize=1000&key=${GOOGLE_API_KEY}`)
    ]);

    const catData = await catRes.json();
    const noteData = await noteRes.json();

    if (catData.error) {
      grid.innerHTML = `<p class="empty-state">Google Error: ${escapeHtml(catData.error.message)}</p>`;
      return;
    }

    const categories = catData.files || [];
    const notes = noteData.files || [];

    if (!categories.length) {
      grid.innerHTML = `<p class="empty-state">No subject folders found inside this Drive folder yet. Create subfolders (like History, Polity) inside Google Drive!</p>`;
      return;
    }

    grid.innerHTML = categories
      .map((cat, i) => {
        const count = notes.filter((n) => n.parents && n.parents.includes(cat.id)).length;
        const reg = `TN-${String(i + 1).padStart(3, "0")}`;
        return `
          <a class="category-card" href="category.html?id=${cat.id}&name=${encodeURIComponent(cat.name)}">
            <span class="cat-index">${reg}</span>
            <h3>${escapeHtml(cat.name)}</h3>
            <span class="cat-count">${count} note${count === 1 ? "" : "s"}</span>
          </a>`;
      })
      .join("");

    document.getElementById("searchInput").addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      document.querySelectorAll(".category-card").forEach((card) => {
        const match = card.textContent.toLowerCase().includes(term);
        card.style.display = match ? "" : "none";
      });
    });
  } catch (err) {
    grid.innerHTML = `<p class="empty-state">Network Error: ${escapeHtml(err.message)}</p>`;
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

loadCategories();

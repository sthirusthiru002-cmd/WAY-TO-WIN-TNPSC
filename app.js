async function loadCategories() {
  const grid = document.getElementById("categoryGrid");
  try {
    const [catRes, noteRes] = await Promise.all([
      fetch(`${API_BASE_URL}/categories`),
      fetch(`${API_BASE_URL}/notes`)
    ]);
    const categories = await catRes.json();
    const notes = await noteRes.json();

    if (!categories.length) {
      grid.innerHTML = `<p class="empty-state">No categories yet. Check back soon.</p>`;
      return;
    }

    grid.innerHTML = categories
      .map((cat, i) => {
        const count = notes.filter((n) => n.categoryId === cat.id).length;
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
    grid.innerHTML = `<p class="empty-state">Could not load categories. Is the backend running?</p>`;
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

loadCategories();

// Register service worker for installability (PWA)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

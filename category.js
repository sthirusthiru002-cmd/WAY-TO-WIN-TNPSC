const params = new URLSearchParams(window.location.search);
const categoryId = params.get("id");
const categoryName = params.get("name") || "Category";

document.getElementById("categoryTitle").textContent = categoryName;

async function loadNotes() {
  const list = document.getElementById("noteList");
  if (!categoryId) {
    list.innerHTML = `<p class="empty-state">No category selected.</p>`;
    return;
  }
  try {
    const res = await fetch(`${API_BASE_URL}/notes?categoryId=${categoryId}`);
    const notes = await res.json();

    if (!notes.length) {
      list.innerHTML = `<p class="empty-state">No notes uploaded in this category yet.</p>`;
      return;
    }

    list.innerHTML = notes
      .map((note, i) => {
        const reg = `REG-${String(i + 1).padStart(4, "0")}`;
        const date = new Date(note.uploadedAt).toLocaleDateString("en-IN", {
          day: "2-digit", month: "short", year: "numeric"
        });
        return `
          <div class="note-entry">
            <span class="note-reg">${reg}</span>
            <div class="note-body">
              <h4>${escapeHtml(note.title)}</h4>
              ${note.description ? `<p>${escapeHtml(note.description)}</p>` : ""}
              <div class="note-meta">Uploaded ${date}</div>
            </div>
            <a class="btn btn-gold" href="${note.viewLink}" target="_blank" rel="noopener">View</a>
            <a class="btn btn-maroon" href="${note.downloadLink}" target="_blank" rel="noopener">Download</a>
          </div>`;
      })
      .join("");
  } catch (err) {
    list.innerHTML = `<p class="empty-state">Could not load notes. Is the backend running?</p>`;
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

loadNotes();

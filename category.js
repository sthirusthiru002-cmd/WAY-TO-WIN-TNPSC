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
    const query = encodeURIComponent(`'${categoryId}' in parents and mimeType != 'application/vnd.google-apps.folder' and trashed = false`);
    const url = `https://googleapis.com{query}&fields=files(id,name,description,createdTime,webViewLink,webContentLink)&orderBy=createdTime desc&key=${GOOGLE_API_KEY}`;
    
    const res = await fetch(url);
    const data = await res.json();
    const notes = data.files || [];

    if (!notes.length) {
      list.innerHTML = `<p class="empty-state">No notes uploaded in this category yet.</p>`;
      return;
    }

    list.innerHTML = notes
      .map((note, i) => {
        const reg = `REG-${String(i + 1).padStart(4, "0")}`;
        const date = new Date(note.createdTime).toLocaleDateString("en-IN", {
          day: "2-digit", month: "short", year: "numeric"
        });
        const downloadUrl = note.webContentLink || `https://google.com{note.id}`;
        return `
          <div class="note-entry">
            <span class="note-reg">${reg}</span>
            <div class="note-body">
              <h4>${escapeHtml(note.name)}</h4>
              ${note.description ? `<p>${escapeHtml(note.description)}</p>` : ""}
              <div class="note-meta">Uploaded ${date}</div>
            </div>
            <a class="btn btn-gold" href="${note.webViewLink}" target="_blank" rel="noopener">View</a>
            <a class="btn btn-maroon" href="${downloadUrl}" target="_blank" rel="noopener">Download</a>
          </div>`;
      })
      .join("");
  } catch (err) {
    list.innerHTML = `<p class="empty-state">Could not load notes. Check your API Key and Drive permissions.</p>`;
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

loadNotes();

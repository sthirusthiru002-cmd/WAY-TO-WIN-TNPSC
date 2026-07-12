const token = localStorage.getItem("tnpsc_admin_token");
if (!token) window.location.href = "login.html";

const authHeader = { Authorization: `Bearer ${token}` };

document.getElementById("logoutBtn").addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem("tnpsc_admin_token");
  window.location.href = "login.html";
});

let categories = [];

async function handleAuthError(res) {
  if (res.status === 401) {
    localStorage.removeItem("tnpsc_admin_token");
    window.location.href = "login.html";
    return true;
  }
  return false;
}

// ---------- Categories ----------
async function loadCategories() {
  const res = await fetch(`${API_BASE_URL}/categories`);
  categories = await res.json();

  const select = document.getElementById("noteCategory");
  select.innerHTML = categories
    .map((c) => `<option value="${c.id}" data-name="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`)
    .join("");

  const wrap = document.getElementById("categoryListWrap");
  if (!categories.length) {
    wrap.innerHTML = `<p class="empty-state">No categories yet — add one above.</p>`;
    return;
  }
  wrap.innerHTML = categories
    .map(
      (c) => `
      <div class="admin-row">
        <span>${escapeHtml(c.name)}</span>
        <div class="admin-row-actions">
          <button class="icon-btn" onclick="renameCategory('${c.id}', '${escapeHtml(c.name)}')">Rename</button>
          <button class="icon-btn danger" onclick="deleteCategory('${c.id}')">Delete</button>
        </div>
      </div>`
    )
    .join("");
}

document.getElementById("categoryForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("catName").value;
  const msg = document.getElementById("catMsg");
  msg.textContent = "";
  msg.className = "form-message";
  try {
    const res = await fetch(`${API_BASE_URL}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ name })
    });
    if (await handleAuthError(res)) return;
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    document.getElementById("catName").value = "";
    msg.textContent = "Category added.";
    msg.classList.add("success");
    loadCategories();
  } catch (err) {
    msg.textContent = err.message;
    msg.classList.add("error");
  }
});

async function renameCategory(id, oldName) {
  const name = prompt("Rename category:", oldName);
  if (!name || name === oldName) return;
  const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeader },
    body: JSON.stringify({ name })
  });
  if (await handleAuthError(res)) return;
  loadCategories();
}

async function deleteCategory(id) {
  if (!confirm("Delete this category? Notes already filed under it will stay but won't show a category name.")) return;
  const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: "DELETE",
    headers: authHeader
  });
  if (await handleAuthError(res)) return;
  loadCategories();
}

// ---------- Notes ----------
document.getElementById("noteForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = document.getElementById("noteMsg");
  const btn = document.getElementById("uploadBtn");
  msg.textContent = "";
  msg.className = "form-message";

  const title = document.getElementById("noteTitle").value;
  const description = document.getElementById("noteDesc").value;
  const select = document.getElementById("noteCategory");
  const categoryId = select.value;
  const categoryName = select.selectedOptions[0]?.dataset.name || "";
  const file = document.getElementById("noteFile").files[0];

  if (!categoryId) {
    msg.textContent = "Create a category first.";
    msg.classList.add("error");
    return;
  }

  const formData = new FormData();
  formData.append("title", title);
  formData.append("description", description);
  formData.append("categoryId", categoryId);
  formData.append("categoryName", categoryName);
  formData.append("file", file);

  btn.disabled = true;
  btn.textContent = "Uploading…";

  try {
    const res = await fetch(`${API_BASE_URL}/notes`, {
      method: "POST",
      headers: authHeader,
      body: formData
    });
    if (await handleAuthError(res)) return;
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    document.getElementById("noteForm").reset();
    msg.textContent = "Uploaded successfully.";
    msg.classList.add("success");
    loadNotes();
    loadCategories();
  } catch (err) {
    msg.textContent = err.message;
    msg.classList.add("error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Upload";
  }
});

async function loadNotes() {
  const res = await fetch(`${API_BASE_URL}/notes`);
  const notes = await res.json();
  const wrap = document.getElementById("noteListWrap");

  if (!notes.length) {
    wrap.innerHTML = `<p class="empty-state">No notes uploaded yet.</p>`;
    return;
  }

  wrap.innerHTML = notes
    .map(
      (n) => `
      <div class="admin-row">
        <span>${escapeHtml(n.title)} <span style="color:var(--ink-soft)">— ${escapeHtml(n.categoryName || "")}</span></span>
        <div class="admin-row-actions">
          <a class="icon-btn" href="${n.viewLink}" target="_blank" rel="noopener">View</a>
          <button class="icon-btn danger" onclick="deleteNote('${n.id}')">Delete</button>
        </div>
      </div>`
    )
    .join("");
}

async function deleteNote(id) {
  if (!confirm("Delete this PDF permanently?")) return;
  const res = await fetch(`${API_BASE_URL}/notes/${id}`, {
    method: "DELETE",
    headers: authHeader
  });
  if (await handleAuthError(res)) return;
  loadNotes();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

loadCategories();
loadNotes();

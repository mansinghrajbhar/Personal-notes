const STORAGE_KEY = "personal-notes-v1";

const state = {
  notes: [],
  folders: [],
  view: "notes",
  folderId: null,
  search: "",
  sort: "updatedDesc",
  editingId: null
};

const $ = (selector) => document.querySelector(selector);

function uid(prefix = "id") {
  return prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) {
      state.notes = Array.isArray(saved.notes) ? saved.notes : [];
      state.folders = Array.isArray(saved.folders) ? saved.folders : [];
      state.sort = saved.sort || "updatedDesc";
    }
  } catch {
    showToast("Could not load saved notes");
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    notes: state.notes,
    folders: state.folders,
    sort: state.sort
  }));
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[c]));
}

function folderById(id) {
  return state.folders.find(f => f.id === id);
}

function folderName(id) {
  return folderById(id)?.name || "";
}

function descendantFolderIds(id) {
  const ids = [id];
  let changed = true;
  while (changed) {
    changed = false;
    for (const folder of state.folders) {
      if (folder.parentId && ids.includes(folder.parentId) && !ids.includes(folder.id)) {
        ids.push(folder.id);
        changed = true;
      }
    }
  }
  return ids;
}

function visibleNotes() {
  let notes = [...state.notes];

  if (state.view === "pinned") notes = notes.filter(n => n.pinned && !n.trashed);
  else if (state.view === "archive") notes = notes.filter(n => n.archived && !n.trashed);
  else if (state.view === "trash") notes = notes.filter(n => n.trashed);
  else {
    notes = notes.filter(n => !n.archived && !n.trashed);
    if (state.folderId) {
      const ids = descendantFolderIds(state.folderId);
      notes = notes.filter(n => ids.includes(n.folderId));
    }
  }

  const query = state.search.trim().toLowerCase();
  if (query) {
    notes = notes.filter(n =>
      (n.title + " " + n.body).toLowerCase().includes(query)
    );
  }

  notes.sort((a, b) => {
    switch (state.sort) {
      case "createdAsc": return a.createdAt - b.createdAt;
      case "createdDesc": return b.createdAt - a.createdAt;
      case "titleAsc": return a.title.localeCompare(b.title);
      case "titleDesc": return b.title.localeCompare(a.title);
      default: return b.updatedAt - a.updatedAt;
    }
  });
  return notes;
}

function render() {
  renderFolderTree();
  renderNotes();
  renderViewTitle();
  populateFolderSelects();
}

function renderViewTitle() {
  const titles = { notes: "Notes", pinned: "Pinned", archive: "Archive", trash: "Trash" };
  $("#viewTitle").textContent = state.folderId && state.view === "notes"
    ? folderName(state.folderId) || "Notes"
    : titles[state.view];
  document.querySelectorAll(".main-nav .nav-item").forEach(btn =>
    btn.classList.toggle("active", btn.dataset.view === state.view && !state.folderId)
  );
}

function renderFolderTree() {
  const root = state.folders.filter(f => !f.parentId);
  $("#folderTree").innerHTML = root.map(f => renderFolder(f, 0)).join("");
}

function renderFolder(folder, depth) {
  const children = state.folders.filter(f => f.parentId === folder.id);
  const count = state.notes.filter(n => n.folderId === folder.id && !n.trashed).length;
  return `
    <div>
      <button class="folder-item ${state.folderId === folder.id ? "active" : ""}" data-folder="${folder.id}" style="padding-left:${8 + depth * 14}px">
        <span class="folder-arrow">${children.length ? "▾" : "·"}</span>
        <span>📁</span>
        <span class="folder-name">${escapeHtml(folder.name)}</span>
        <span class="folder-count">${count}</span>
      </button>
      <div class="folder-children">
        ${children.map(child => renderFolder(child, depth + 1)).join("")}
      </div>
    </div>`;
}

function renderNotes() {
  const notes = visibleNotes();
  const grid = $("#notesGrid");
  grid.innerHTML = notes.map(renderCard).join("");
  $("#emptyState").classList.toggle("hidden", notes.length > 0);
  if (!notes.length) {
    $("#emptyTitle").textContent = state.search ? "No matching notes" :
      state.view === "trash" ? "Trash is empty" : "No notes yet";
    $("#emptyText").textContent = state.search ? "Try another search." : "Create your first note below.";
  }
}

function renderCard(note) {
  const folder = folderName(note.folderId);
  const date = new Date(note.updatedAt).toLocaleDateString(undefined, { month:"short", day:"numeric" });
  return `
    <article class="note-card ${note.pinned ? "pinned" : ""}" data-note="${note.id}">
      ${note.title ? `<h3>${escapeHtml(note.title)}</h3>` : ""}
      <div class="note-body">${escapeHtml(note.body)}</div>
      <div class="note-meta">
        ${note.pinned ? "<span>📌</span>" : ""}
        ${folder ? `<span class="note-folder">${escapeHtml(folder)}</span>` : ""}
        <span>${date}</span>
      </div>
      <div class="note-actions">
        <button class="card-btn" data-action="pin">${note.pinned ? "Unpin" : "Pin"}</button>
        <button class="card-btn" data-action="share">Share</button>
        <button class="card-btn" data-action="delete">${note.trashed ? "Delete forever" : "Delete"}</button>
      </div>
    </article>`;
}

function openNote(id = null) {
  state.editingId = id;
  const note = id ? state.notes.find(n => n.id === id) : null;
  $("#noteTitle").value = note?.title || "";
  $("#noteBody").value = note?.body || "";
  $("#noteFolder").value = note?.folderId || "";
  $("#pinBtn").textContent = note?.pinned ? "★ Unpin" : "☆ Pin";
  $("#archiveBtn").textContent = note?.archived ? "▤ Unarchive" : "▤ Archive";
  $("#deleteNoteBtn").classList.toggle("hidden", !note);
  $("#noteDialog").showModal();
  setTimeout(() => $("#noteTitle").focus(), 50);
}

function closeNote() {
  $("#noteDialog").close();
  state.editingId = null;
}

function saveNoteFromDialog() {
  const title = $("#noteTitle").value.trim();
  const body = $("#noteBody").value.trim();
  if (!title && !body) {
    closeNote();
    return;
  }

  const now = Date.now();
  if (state.editingId) {
    const note = state.notes.find(n => n.id === state.editingId);
    Object.assign(note, { title, body, folderId: $("#noteFolder").value || null, updatedAt: now });
  } else {
    state.notes.push({
      id: uid("note"), title, body,
      folderId: $("#noteFolder").value || state.folderId || null,
      pinned: false, archived: false, trashed: false,
      createdAt: now, updatedAt: now
    });
  }
  save();
  closeNote();
  render();
  showToast("Note saved");
}

function toggleNoteProperty(id, property) {
  const note = state.notes.find(n => n.id === id);
  if (!note) return;
  note[property] = !note[property];
  note.updatedAt = Date.now();
  save();
  render();
}

function deleteNote(note) {
  if (!note) return;
  if (note.trashed) {
    state.notes = state.notes.filter(n => n.id !== note.id);
    showToast("Note deleted permanently");
  } else {
    note.trashed = true;
    note.archived = false;
    showToast("Moved to trash");
  }
  save();
  render();
}

async function shareNote(note) {
  const text = [note.title, note.body].filter(Boolean).join("\n\n");
  if (navigator.share) {
    try {
      await navigator.share({ title: note.title || "Personal Note", text });
    } catch {}
  } else if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    showToast("Note copied to clipboard");
  } else {
    showToast("Sharing is not supported here");
  }
}

function populateFolderSelects() {
  const options = `<option value="">No folder</option>` + buildFolderOptions();
  $("#noteFolder").innerHTML = options;
  $("#parentFolder").innerHTML = `<option value="">No parent folder</option>` + buildFolderOptions();
}

function buildFolderOptions(parent = null, depth = 0) {
  return state.folders
    .filter(f => (f.parentId || null) === parent)
    .map(f => `<option value="${f.id}">${"— ".repeat(depth)}📁 ${escapeHtml(f.name)}</option>` +
      buildFolderOptions(f.id, depth + 1)).join("");
}

function createFolder() {
  const name = $("#folderName").value.trim();
  if (!name) return;
  state.folders.push({
    id: uid("folder"),
    name,
    parentId: $("#parentFolder").value || null,
    createdAt: Date.now()
  });
  save();
  $("#folderDialog").close();
  $("#folderForm").reset();
  render();
  showToast("Folder created");
}

function setView(view, folderId = null) {
  state.view = view;
  state.folderId = folderId;
  render();
  if (window.innerWidth <= 900) closeSidebar();
}

function closeSidebar() {
  $("#sidebar").classList.remove("open");
  $("#overlay").classList.remove("show");
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

document.addEventListener("click", async (event) => {
  const nav = event.target.closest("[data-view]");
  if (nav) setView(nav.dataset.view);

  const folder = event.target.closest("[data-folder]");
  if (folder) setView("notes", folder.dataset.folder);

  const card = event.target.closest(".note-card");
  if (card) {
    const action = event.target.closest("[data-action]")?.dataset.action;
    const note = state.notes.find(n => n.id === card.dataset.note);
    if (!action) openNote(note.id);
    else if (action === "pin") toggleNoteProperty(note.id, "pinned");
    else if (action === "share") shareNote(note);
    else if (action === "delete") deleteNote(note);
  }

  const sort = event.target.closest("[data-sort]");
  if (sort) {
    state.sort = sort.dataset.sort;
    $("#sortMenu").classList.add("hidden");
    save(); renderNotes();
  }
});

$("#newNoteBtn").addEventListener("click", () => openNote());
$("#closeNoteDialog").addEventListener("click", closeNote);
$("#noteForm").addEventListener("submit", event => {
  event.preventDefault();
  saveNoteFromDialog();
});
$("#pinBtn").addEventListener("click", () => {
  if (!state.editingId) return;
  toggleNoteProperty(state.editingId, "pinned");
  const note = state.notes.find(n => n.id === state.editingId);
  $("#pinBtn").textContent = note?.pinned ? "★ Unpin" : "☆ Pin";
});
$("#archiveBtn").addEventListener("click", () => {
  if (!state.editingId) return;
  toggleNoteProperty(state.editingId, "archived");
  const note = state.notes.find(n => n.id === state.editingId);
  $("#archiveBtn").textContent = note?.archived ? "▤ Unarchive" : "▤ Archive";
});
$("#deleteNoteBtn").addEventListener("click", () => {
  const note = state.notes.find(n => n.id === state.editingId);
  deleteNote(note);
  closeNote();
});
$("#shareBtn").addEventListener("click", () => {
  const note = state.notes.find(n => n.id === state.editingId);
  if (note) shareNote(note);
});
$("#addFolderBtn").addEventListener("click", () => {
  populateFolderSelects();
  $("#folderDialog").showModal();
  $("#folderName").focus();
});
$("#cancelFolder").addEventListener("click", () => $("#folderDialog").close());
$("#folderForm").addEventListener("submit", event => {
  event.preventDefault();
  createFolder();
});
$("#sortBtn").addEventListener("click", () => $("#sortMenu").classList.toggle("hidden"));
$("#refreshBtn").addEventListener("click", () => { render(); showToast("Notes refreshed"); });
$("#searchInput").addEventListener("input", event => {
  state.search = event.target.value;
  $("#clearSearch").classList.toggle("hidden", !state.search);
  renderNotes();
});
$("#clearSearch").addEventListener("click", () => {
  $("#searchInput").value = "";
  state.search = "";
  $("#clearSearch").classList.add("hidden");
  renderNotes();
});
$("#menuBtn").addEventListener("click", () => {
  $("#sidebar").classList.add("open");
  $("#overlay").classList.add("show");
});
$("#closeSidebar").addEventListener("click", closeSidebar);
$("#overlay").addEventListener("click", closeSidebar);

$("#syncBtn").addEventListener("click", () => {
  showToast("Google sync will be connected in the next phase");
});

document.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    $("#searchInput").focus();
  }
  if (event.key === "Escape") {
    $("#sortMenu").classList.add("hidden");
  }
});

load();
render();
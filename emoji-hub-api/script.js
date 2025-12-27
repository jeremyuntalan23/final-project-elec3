const API_BASE = "https://emojihub.yurace.pro/api";

// ---------- DOM ----------
const els = {
  searchInput: document.getElementById("searchInput"),
  searchBtn: document.getElementById("searchBtn"),
  categorySelect: document.getElementById("categorySelect"),
  groupSelect: document.getElementById("groupSelect"),
  randomBtn: document.getElementById("randomBtn"),
  clearBtn: document.getElementById("clearBtn"),
  showFavoritesBtn: document.getElementById("showFavoritesBtn"),
  results: document.getElementById("results"),
  errorBox: document.getElementById("errorBox"),
  resultsCount: document.getElementById("resultsCount"),
  themeToggle: document.getElementById("themeToggle"),
};

let showingFavorites = false;
const MAX_RENDER = 80;

// ---------- Button loading (Search only) ----------
function setSearchLoading(isLoading) {
  if (isLoading) {
    els.searchBtn.disabled = true;
    els.searchBtn.dataset.originalText = els.searchBtn.textContent;
    els.searchBtn.textContent = "Searching…";
  } else {
    els.searchBtn.disabled = false;
    els.searchBtn.textContent = els.searchBtn.dataset.originalText || "Search";
  }
}

// ---------- UI helpers ----------
function setError(message) {
  if (!message) {
    els.errorBox.hidden = true;
    els.errorBox.textContent = "";
    return;
  }
  els.errorBox.hidden = false;
  els.errorBox.textContent = message;
}

function setCount(n, label = "results") {
  els.resultsCount.textContent = Number.isFinite(n) ? `${n} ${label}` : "";
}

function clearResults() {
  els.results.innerHTML = "";
  setCount(NaN);
}

function sanitizeInput(v) {
  return v.trim();
}

function validateQuery(q) {
  if (!q) return { ok: false, message: "Please type something to search." };
  const allowed = /^[a-zA-Z0-9\s\-']+$/;
  if (!allowed.test(q)) {
    return { ok: false, message: "Invalid characters. Use letters/numbers/spaces/hyphen/apostrophe only." };
  }
  return { ok: true, message: "" };
}

function encodePathSegment(segment) {
  return encodeURIComponent(segment);
}

// ---------- Favorites ----------
const FAV_KEY = "emojihub_favorites_v1";

function readFavorites() {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeFavorites(list) {
  localStorage.setItem(FAV_KEY, JSON.stringify(list));
}

function isFavorited(emojiObj) {
  const favs = readFavorites();
  return favs.some(
    (f) => f.name === emojiObj.name && (f.unicode?.[0] || "") === (emojiObj.unicode?.[0] || "")
  );
}

function toggleFavorite(emojiObj) {
  const favs = readFavorites();
  const keyUnicode = emojiObj.unicode?.[0] || "";

  const idx = favs.findIndex(
    (f) => f.name === emojiObj.name && (f.unicode?.[0] || "") === keyUnicode
  );

  if (idx >= 0) favs.splice(idx, 1);
  else favs.push(emojiObj);

  writeFavorites(favs);
}

// ---------- API (CACHE) ----------
const cache = new Map();

async function apiGet(path) {
  const url = `${API_BASE}${path}`;
  if (cache.has(url)) return cache.get(url);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);

  const data = await res.json();
  cache.set(url, data);
  return data;
}

const getCategories = () => apiGet("/categories");
const getGroups = () => apiGet("/groups");
const getRandomEmoji = () => apiGet("/random");
const searchByName = (q) => apiGet(`/search?q=${encodeURIComponent(q)}`);
const getSimilarByName = (name) => apiGet(`/similar/${encodePathSegment(name)}`);
const getAllByCategory = (cat) => apiGet(`/all/category/${encodePathSegment(cat)}`);
const getAllByGroup = (grp) => apiGet(`/all/group/${encodePathSegment(grp)}`);

// ---------- Rendering ----------
function makeEmojiSymbol(htmlCodeArray) {
  const span = document.createElement("span");
  span.innerHTML = (htmlCodeArray && htmlCodeArray[0]) ? htmlCodeArray[0] : "❓";
  return span.textContent || "❓";
}

function renderEmojiCards(list, countLabel = "results") {
  clearResults();
  setError("");

  if (!Array.isArray(list) || list.length === 0) {
    setError("No results found.");
    setCount(0, countLabel);
    return;
  }

  let toRender = list;
  if (MAX_RENDER && list.length > MAX_RENDER) {
    toRender = list.slice(0, MAX_RENDER);
    setError(`Showing first ${MAX_RENDER} items for performance.`);
  }

  const frag = document.createDocumentFragment();

  toRender.forEach((emoji) => {
    const card = document.createElement("article");
    card.className = "card";

    const symbol = document.createElement("div");
    symbol.className = "emoji";
    symbol.textContent = makeEmojiSymbol(emoji.htmlCode);

    const title = document.createElement("h3");
    title.textContent = emoji.name || "(no name)";

    const pills = document.createElement("div");
    pills.className = "pills";

    const pillCat = document.createElement("span");
    pillCat.className = "pill";
    pillCat.textContent = `Category: ${emoji.category || "?"}`;

    const pillGroup = document.createElement("span");
    pillGroup.className = "pill";
    pillGroup.textContent = `Group: ${emoji.group || "?"}`;

    pills.append(pillCat, pillGroup);

    const unicode = document.createElement("div");
    unicode.className = "muted";
    unicode.style.fontSize = "12px";
    unicode.textContent = `Unicode: ${(emoji.unicode && emoji.unicode[0]) ? emoji.unicode[0] : "?"}`;

    const row = document.createElement("div");
    row.className = "row2";

    const similarBtn = document.createElement("button");
    similarBtn.className = "btn";
    similarBtn.type = "button";
    similarBtn.textContent = "🔁 Similar";
    similarBtn.addEventListener("click", () => onSimilar(emoji.name));

    const favBtn = document.createElement("button");
    favBtn.className = "btn";
    favBtn.type = "button";
    favBtn.textContent = isFavorited(emoji) ? "⭐ Saved" : "☆ Save";
    favBtn.addEventListener("click", () => {
      toggleFavorite(emoji);
      favBtn.textContent = isFavorited(emoji) ? "⭐ Saved" : "☆ Save";
    });

    row.append(similarBtn, favBtn);

    card.append(symbol, title, pills, unicode, row);
    frag.appendChild(card);
  });

  els.results.appendChild(frag);
  setCount(list.length, countLabel);
}

function fillSelect(selectEl, items, placeholder) {
  selectEl.innerHTML = "";

  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = placeholder;
  selectEl.appendChild(opt0);

  (items || []).forEach((item) => {
    const opt = document.createElement("option");
    opt.value = item;
    opt.textContent = item;
    selectEl.appendChild(opt);
  });
}

// ---------- Handlers ----------
async function onInit() {
  initTheme();
  setError("");

  try {
    const [categories, groups] = await Promise.all([getCategories(), getGroups()]);
    fillSelect(els.categorySelect, categories, "Select category…");
    fillSelect(els.groupSelect, groups, "Select group…");
  } catch {
    setError("Failed to load categories/groups. Refresh and try again.");
  }
}

async function onSearch() {
  showingFavorites = false;
  els.showFavoritesBtn.textContent = "⭐ Favorites";

  const q = sanitizeInput(els.searchInput.value);
  const v = validateQuery(q);
  if (!v.ok) return setError(v.message);

  setError("");
  setSearchLoading(true);

  try {
    const data = await searchByName(q);
    renderEmojiCards(data);
  } catch {
    setError("Failed API call. Please try again.");
  } finally {
    setSearchLoading(false);
  }
}

async function onCategoryChange() {
  const cat = els.categorySelect.value;
  if (!cat) return;

  showingFavorites = false;
  els.showFavoritesBtn.textContent = "⭐ Favorites";

  try {
    const data = await getAllByCategory(cat);
    renderEmojiCards(data);
  } catch {
    setError("Failed to load emojis for that category.");
  }
}

async function onGroupChange() {
  const grp = els.groupSelect.value;
  if (!grp) return;

  showingFavorites = false;
  els.showFavoritesBtn.textContent = "⭐ Favorites";

  try {
    const data = await getAllByGroup(grp);
    renderEmojiCards(data);
  } catch {
    setError("Failed to load emojis for that group.");
  }
}

async function onRandom() {
  showingFavorites = false;
  els.showFavoritesBtn.textContent = "⭐ Favorites";

  try {
    const one = await getRandomEmoji();
    renderEmojiCards([one]);
  } catch {
    setError("Failed to get random emoji.");
  }
}

async function onSimilar(name) {
  if (!name) return;

  try {
    const list = await getSimilarByName(name);
    renderEmojiCards(list);
  } catch {
    setError("Failed to load similar emojis.");
  }
}

function onClear() {
  els.searchInput.value = "";
  els.categorySelect.value = "";
  els.groupSelect.value = "";
  setError("");
  clearResults();

  showingFavorites = false;
  els.showFavoritesBtn.textContent = "⭐ Favorites";

  // restore button if user cleared mid-search
  setSearchLoading(false);
}

function onToggleFavorites() {
  showingFavorites = !showingFavorites;

  if (showingFavorites) {
    const favs = readFavorites();
    els.showFavoritesBtn.textContent = "🧾 Back to Results";
    renderEmojiCards(favs, "favorites");
  } else {
    els.showFavoritesBtn.textContent = "⭐ Favorites";
    clearResults();
  }
}

// ---------- Theme ----------
function initTheme() {
  const saved = localStorage.getItem("theme") || "dark";
  document.body.classList.toggle("light", saved === "light");
  updateThemeButtonText();
}

function toggleTheme() {
  const isLight = document.body.classList.toggle("light");
  localStorage.setItem("theme", isLight ? "light" : "dark");
  updateThemeButtonText();
}

function updateThemeButtonText() {
  const isLight = document.body.classList.contains("light");
  const label = isLight ? "Dark" : "Light";
  const icon = isLight ? "🌙" : "☀️";
  els.themeToggle.innerHTML = `${icon} <span class="btn-text">${label}</span>`;
}

// ---------- Events ----------
els.searchBtn.addEventListener("click", onSearch);
els.searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") onSearch();
});
els.categorySelect.addEventListener("change", onCategoryChange);
els.groupSelect.addEventListener("change", onGroupChange);
els.randomBtn.addEventListener("click", onRandom);
els.clearBtn.addEventListener("click", onClear);
els.showFavoritesBtn.addEventListener("click", onToggleFavorites);
els.themeToggle.addEventListener("click", toggleTheme);

// Start
onInit();

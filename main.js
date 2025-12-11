import { mockProvider } from "./providers/mockProvider.js";
import { fetchAllProviders } from "./services/aggregator.js";
import { DEFAULT_TAGS, STORES } from "./services/constants.js";

const state = {
  games: [],
  filters: {
    search: "",
    sources: new Set(),
    tags: new Set(),
  },
  selectedGameId: null,
};

const providerList = [mockProvider];

/** Initialize the UI */
async function init() {
  wireControls();
  await loadGames();
}

function wireControls() {
  const searchInput = document.getElementById("search");
  searchInput.addEventListener("input", (e) => {
    state.filters.search = e.target.value.toLowerCase();
    renderGames();
  });

  const refreshButton = document.getElementById("refresh-all");
  refreshButton.addEventListener("click", async () => {
    refreshButton.disabled = true;
    await loadGames();
    refreshButton.disabled = false;
  });
}

async function loadGames() {
  setStatus("Loading providers...");
  const { games, errors } = await fetchAllProviders(providerList);
  state.games = games;
  if (state.filters.sources.size === 0) {
    games.forEach((game) => game.sources.forEach((src) => state.filters.sources.add(src.store)));
  }
  renderFilters();
  renderGames();
  renderDetail(null);
  setStatus(errors.length ? errors.join(" · ") : "Showing latest mock releases.");
}

function renderFilters() {
  const sourceContainer = document.getElementById("source-filters");
  const tagContainer = document.getElementById("tag-filters");
  sourceContainer.innerHTML = "";
  tagContainer.innerHTML = "";

  const sources = Array.from(
    new Set(state.games.flatMap((g) => g.sources.map((s) => s.store)))
  );

  sources.forEach((source) => {
    const id = `src-${source}`;
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.innerHTML = `
      <input type="checkbox" id="${id}" ${state.filters.sources.has(source) ? "checked" : ""} />
      <label for="${id}">${formatStore(source)}</label>
    `;
    chip.querySelector("input").addEventListener("change", (e) => {
      if (e.target.checked) state.filters.sources.add(source);
      else state.filters.sources.delete(source);
      renderGames();
    });
    sourceContainer.appendChild(chip);
  });

  DEFAULT_TAGS.forEach((tag) => {
    const id = `tag-${tag.replace(/\s+/g, "-")}`;
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.innerHTML = `
      <input type="checkbox" id="${id}" ${state.filters.tags.has(tag) ? "checked" : ""} />
      <label for="${id}">${tag}</label>
    `;
    chip.querySelector("input").addEventListener("change", (e) => {
      if (e.target.checked) state.filters.tags.add(tag);
      else state.filters.tags.delete(tag);
      renderGames();
    });
    tagContainer.appendChild(chip);
  });
}

function renderGames() {
  const listEl = document.getElementById("game-list");
  listEl.innerHTML = "";
  const games = applyFilters();
  if (!games.length) {
    listEl.innerHTML = '<p class="muted">No games match these filters.</p>';
    return;
  }

  const template = document.getElementById("game-card-template");
  games.forEach((game) => {
    const node = template.content.cloneNode(true);
    node.querySelector(".game-title").textContent = game.title;
    node.querySelector(".release-date").textContent = formatDate(game.releaseDate);
    node.querySelector(".summary").textContent = game.summary || game.description.slice(0, 140);

    const tagWrap = node.querySelector(".tags");
    if (game.tags?.length) {
      game.tags.slice(0, 4).forEach((tag) => {
        const span = document.createElement("span");
        span.className = "tag";
        span.textContent = tag.name;
        tagWrap.appendChild(span);
      });
    } else {
      const placeholder = document.createElement("span");
      placeholder.className = "tag ghost";
      placeholder.textContent = "No tags yet";
      tagWrap.appendChild(placeholder);
    }

    const storeWrap = node.querySelector(".stores");
    game.sources.forEach((src) => {
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = formatStore(src.store);
      storeWrap.appendChild(badge);
    });

    node.querySelector(".view-details").addEventListener("click", () => renderDetail(game));
    listEl.appendChild(node);
  });
}

function renderDetail(game) {
  const card = document.getElementById("detail-card");
  if (!game) {
    card.className = "detail-card empty";
    card.innerHTML = "<p>Select a game to see details.</p>";
    return;
  }
  state.selectedGameId = game.id;
  card.className = "detail-card";
  card.innerHTML = `
    <h3>${game.title}</h3>
    <div class="detail-meta">Release: ${formatDate(game.releaseDate)} · Platforms: ${game.platforms.join(", ")}</div>
    <div class="detail-stores">${game.sources
      .map((src) => `<a href="${src.storeUrl}" target="_blank" rel="noopener noreferrer">${formatStore(src.store)}</a>`)
      .join(" ")}</div>
    <p class="detail-description">${game.description}</p>
    <div class="tags">${game.tags.map((t) => `<span class="tag">${t.name}</span>`).join(" ")}</div>
  `;
}

function applyFilters() {
  return state.games.filter((game) => {
    const matchesSource = game.sources.some((src) => state.filters.sources.has(src.store));
    const matchesSearch = state.filters.search
      ? game.title.toLowerCase().includes(state.filters.search)
      : true;
    const matchesTags = state.filters.tags.size
      ? game.tags.some((tag) => state.filters.tags.has(tag.name))
      : true;
    return matchesSource && matchesSearch && matchesTags;
  });
}

function setStatus(message) {
  const statusEl = document.getElementById("status");
  statusEl.textContent = message;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatStore(store) {
  switch (store) {
    case STORES.STEAM:
      return "Steam";
    case STORES.STEAMDB:
      return "SteamDB";
    case STORES.ITCH:
      return "itch.io";
    case STORES.GOG:
      return "GOG";
    case STORES.EPIC:
      return "Epic";
    default:
      return "Other";
  }
}

init();

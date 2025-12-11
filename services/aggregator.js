import { callGemini } from "./gemini.js";
import { STORES } from "./constants.js";

/**
 * @typedef {Object} GameTag
 * @property {string} name
 * @property {number} [confidence]
 */

/**
 * @typedef {Object} GameSource
 * @property {"steam"|"steamdb"|"itch"|"gog"|"epic"|"other"} store
 * @property {string} storeId
 * @property {string} storeUrl
 * @property {number|null} [price]
 * @property {string|null} [currency]
 */

/**
 * @typedef {Object} Game
 * @property {string} id
 * @property {string} title
 * @property {string} slug
 * @property {string} description
 * @property {string} summary
 * @property {string[]} platforms
 * @property {string} releaseDate
 * @property {GameTag[]} tags
 * @property {GameSource[]} sources
 * @property {string} [provider]
 */

/**
 * @typedef {Object} GameProvider
 * @property {string} name
 * @property {(options: { limit?: number; since?: Date }) => Promise<Game[]>} fetchNewReleases
 */

/**
 * Aggregate and normalize games from providers.
 * @param {GameProvider[]} providers
 * @returns {Promise<{ games: Game[]; errors: string[] }>} normalized games sorted by release date
 */
export async function fetchAllProviders(providers) {
  const errors = [];
  const results = await Promise.all(
    providers.map(async (provider) => {
      try {
        const games = await provider.fetchNewReleases({ limit: 30 });
        return games.map((game) => normalizeGame(game, provider.name));
      } catch (error) {
        console.error(`Failed to fetch ${provider.name}`, error);
        errors.push(`${provider.name} unavailable`);
        return [];
      }
    })
  );

  const merged = dedupeGames(results.flat());
  const enriched = await enrichSummaries(merged);
  const sorted = enriched.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
  return { games: sorted, errors };
}

/**
 * Normalize a game to ensure required fields and consistent shapes.
 * @param {Game} game
 * @param {string} providerName
 * @returns {Game}
 */
function normalizeGame(game, providerName) {
  const normalizedSources = (game.sources || []).map((s) => ({
    store: s.store || STORES.OTHER,
    storeId: s.storeId || game.id,
    storeUrl: s.storeUrl || "#",
    price: s.price ?? null,
    currency: s.currency ?? null,
  }));

  return {
    id: game.id,
    title: game.title,
    slug: game.slug || game.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: game.description || "",
    summary: game.summary || "",
    platforms: game.platforms || ["pc"],
    releaseDate: game.releaseDate,
    tags: game.tags || [],
    sources: normalizedSources.length ? normalizedSources : [{ store: STORES.OTHER, storeId: game.id, storeUrl: "#" }],
    provider: providerName,
  };
}

/**
 * Deduplicate games by title + release date + primary store.
 * @param {Game[]} games
 * @returns {Game[]}
 */
function dedupeGames(games) {
  const seen = new Map();
  games.forEach((game) => {
    const key = `${game.title.toLowerCase()}-${game.releaseDate}`;
    if (!seen.has(key)) {
      seen.set(key, game);
      return;
    }
    const existing = seen.get(key);
    // merge sources and tags
    const mergedSources = mergeSources(existing.sources, game.sources);
    const mergedTags = mergeTags(existing.tags, game.tags);
    seen.set(key, { ...existing, sources: mergedSources, tags: mergedTags });
  });
  return Array.from(seen.values());
}

function mergeSources(a, b) {
  const byStore = new Map();
  [...a, ...b].forEach((src) => {
    if (!byStore.has(src.store)) byStore.set(src.store, src);
  });
  return Array.from(byStore.values());
}

function mergeTags(a, b) {
  const names = new Set();
  const merged = [];
  [...a, ...b].forEach((tag) => {
    if (!names.has(tag.name)) {
      names.add(tag.name);
      merged.push(tag);
    }
  });
  return merged;
}

async function enrichSummaries(games) {
  const enriched = await Promise.all(
    games.map(async (game) => {
      if (game.summary && game.summary.trim().length > 0) return game;
      try {
        const prompt = `Summarize this simulation game in one sentence: ${game.description}`;
        const response = await callGemini("gemini-pro", prompt);
        return { ...game, summary: response.text || game.description.slice(0, 140) };
      } catch (error) {
        console.warn("Gemini enrichment skipped", error);
        return { ...game, summary: game.description.slice(0, 140) };
      }
    })
  );
  return enriched;
}

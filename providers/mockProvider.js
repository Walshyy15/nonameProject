import { STORES } from "../services/constants.js";

/**
 * @typedef {import('../services/aggregator.js').Game} Game
 */

const sampleGames = [
  {
    id: "mock-1",
    title: "Orbital Life Simulator",
    slug: "orbital-life-simulator",
    description: "Manage a small habitat in orbit, balancing life support, crew morale, and research agendas.",
    summary: "Run a modular orbital habitat with crew management and research decisions.",
    platforms: ["pc"],
    releaseDate: "2024-06-12",
    tags: [
      { name: "management" },
      { name: "life sim" },
      { name: "space" },
    ],
    sources: [
      { store: STORES.STEAM, storeId: "12345", storeUrl: "https://store.steampowered.com/app/12345" },
      { store: STORES.STEAMDB, storeId: "12345", storeUrl: "https://steamdb.info/app/12345/" },
    ],
  },
  {
    id: "mock-2",
    title: "Farm Hands 2",
    slug: "farm-hands-2",
    description: "Cozy farming sim with seasonal festivals, co-op chores, and livestock breeding.",
    summary: "Grow crops, care for animals, and join seasonal farm events solo or co-op.",
    platforms: ["pc"],
    releaseDate: "2024-05-28",
    tags: [
      { name: "farming" },
      { name: "life sim" },
    ],
    sources: [
      { store: STORES.ITCH, storeId: "farm-hands-2", storeUrl: "https://itch.io/farm-hands-2" },
    ],
  },
  {
    id: "mock-3",
    title: "Tower Dispatcher",
    slug: "tower-dispatcher",
    description: "Coordinate aircraft arrivals and departures with realistic traffic surges and weather.",
    summary: "Control airport traffic patterns and keep runways flowing safely.",
    platforms: ["pc"],
    releaseDate: "2024-06-05",
    tags: [
      { name: "vehicle" },
      { name: "management" },
      { name: "job sim" },
    ],
    sources: [
      { store: STORES.GOG, storeId: "tower-dispatcher", storeUrl: "https://www.gog.com/en/game/tower_dispatcher" },
      { store: STORES.EPIC, storeId: "tower-dispatcher", storeUrl: "https://store.epicgames.com/p/tower-dispatcher" },
    ],
  },
  {
    id: "mock-4",
    title: "Underwater Ops",
    slug: "underwater-ops",
    description: "Pilot remotely operated vehicles to repair subsea pipelines and manage oxygen budgets.",
    summary: "Command ROV missions, balance energy use, and repair critical underwater infrastructure.",
    platforms: ["pc"],
    releaseDate: "2024-06-18",
    tags: [
      { name: "job sim" },
      { name: "vehicle" },
    ],
    sources: [
      { store: STORES.EPIC, storeId: "underwater-ops", storeUrl: "https://store.epicgames.com/p/underwater-ops" },
    ],
  },
];

export const mockProvider = {
  name: "mock",
  description: "Mock provider used for prototyping without external APIs.",
  /**
   * @param {{ limit?: number }} options
   * @returns {Promise<Game[]>}
   */
  async fetchNewReleases(options = {}) {
    const { limit } = options;
    // In a real provider, this is where fetch calls and error handling would go
    const dataset = [...sampleGames].sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
    return limit ? dataset.slice(0, limit) : dataset;
  },
};

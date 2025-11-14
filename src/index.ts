import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const endpointLines = [
	"Search endpoint: https://api.tvmaze.com/search/shows?q=<query>",
	"Show endpoint: https://api.tvmaze.com/shows/{id}",
	"Cast endpoint: https://api.tvmaze.com/shows/{id}/cast",
	"Crew endpoint: https://api.tvmaze.com/shows/{id}/crew",
	"Seasons endpoint: https://api.tvmaze.com/shows/{id}/seasons",
	"Episodes endpoint: https://api.tvmaze.com/seasons/{id}/episodes[?embed=guestcast]",
];

const searchInputSchema = z.object({
	query: z.string().min(1, "Provide a search query"),
	limit: z
		.number()
		.int()
		.min(1)
		.max(20)
		.default(5)
		.describe("Maximum number of shows to return (1-20)"),
});

const showSchema = z.object({
	id: z.number(),
	name: z.string(),
	url: z.string().url(),
	type: z.string().nullable().optional(),
	language: z.string().nullable().optional(),
	genres: z.array(z.string()),
	status: z.string().nullable().optional(),
	premiered: z.string().nullable().optional(),
	officialSite: z.string().url().nullable().optional(),
	rating: z
		.object({
			average: z.number().nullable(),
		})
		.nullable()
		.optional(),
	summary: z.string().nullable().optional(),
});

const searchOutputSchema = z.object({
	query: z.string(),
	results: z.array(
		z.object({
			score: z.number(),
			show: showSchema,
		}),
	),
});

const showDetailsInputSchema = z.object({
	id: z
		.number()
		.int()
		.positive()
		.describe("TVMaze show ID, e.g. https://api.tvmaze.com/shows/{id}"),
});

const showDetailsOutputSchema = z.object({
	show: showSchema,
});

const imageSchema = z
	.object({
		medium: z.string().url().nullable(),
		original: z.string().url().nullable(),
	})
	.partial();

const personSchema = z
	.object({
		id: z.number(),
		name: z.string(),
		url: z.string().url().optional(),
		country: z
			.object({
				name: z.string().nullable(),
				code: z.string().nullable(),
				timezone: z.string().nullable(),
			})
			.nullable()
			.optional(),
		birthday: z.string().nullable().optional(),
		deathday: z.string().nullable().optional(),
		gender: z.string().nullable().optional(),
		image: imageSchema.nullable().optional(),
	})
	.passthrough();

const characterSchema = z
	.object({
		id: z.number(),
		name: z.string(),
		url: z.string().url().optional(),
		image: imageSchema.nullable().optional(),
	})
	.passthrough();

const castMemberSchema = z.object({
	person: personSchema,
	character: characterSchema.nullable().optional(),
	self: z.boolean().optional(),
	voice: z.boolean().optional(),
});

const crewMemberSchema = z.object({
	type: z.string(),
	person: personSchema,
});

const castCrewInputSchema = z.object({
	id: z
		.number()
		.int()
		.positive()
		.describe("TVMaze show ID, e.g. https://api.tvmaze.com/shows/{id}"),
	castLimit: z
		.number()
		.int()
		.min(1)
		.max(20)
		.default(5)
		.describe("Number of cast entries to highlight in plaintext output")
		.optional(),
	crewLimit: z
		.number()
		.int()
		.min(1)
		.max(20)
		.default(5)
		.describe("Number of crew entries to highlight in plaintext output")
		.optional(),
});

const castCrewOutputSchema = z.object({
	showId: z.number(),
	cast: z.array(castMemberSchema),
	crew: z.array(crewMemberSchema),
});

const seasonSchema = z.object({
	id: z.number(),
	number: z.number().nullable(),
	name: z.string().nullable(),
	episodeOrder: z.number().nullable().optional(),
	premiereDate: z.string().nullable().optional(),
	endDate: z.string().nullable().optional(),
	network: z
		.object({
			id: z.number(),
			name: z.string(),
			country: z
				.object({
					name: z.string().nullable(),
					code: z.string().nullable(),
					timezone: z.string().nullable(),
				})
				.nullable()
				.optional(),
		})
		.nullable()
		.optional(),
	webChannel: z
		.object({
			id: z.number(),
			name: z.string(),
			country: z
				.object({
					name: z.string().nullable(),
					code: z.string().nullable(),
					timezone: z.string().nullable(),
				})
				.nullable()
				.optional(),
		})
		.nullable()
		.optional(),
	image: imageSchema.nullable().optional(),
	summary: z.string().nullable().optional(),
});

const episodeSchema = z.object({
	id: z.number(),
	name: z.string(),
	season: z.number(),
	number: z.number().nullable().optional(),
	airdate: z.string().nullable().optional(),
	airtime: z.string().nullable().optional(),
	airstamp: z.string().nullable().optional(),
	runtime: z.number().nullable().optional(),
	rating: z
		.object({
			average: z.number().nullable(),
		})
		.nullable()
		.optional(),
	summary: z.string().nullable().optional(),
	image: imageSchema.nullable().optional(),
	_embedded: z
		.object({
			guestcast: z
				.array(
					z.object({
						person: personSchema,
						character: characterSchema.nullable().optional(),
						self: z.boolean().optional(),
						voice: z.boolean().optional(),
					}),
				)
				.optional(),
		})
		.optional(),
});

const seasonsInputSchema = z.object({
	showId: z.number().int().positive().describe("TVMaze show ID e.g. /shows/{id}"),
	previewLimit: z
		.number()
		.int()
		.min(1)
		.max(20)
		.default(5)
		.describe("Number of seasons to highlight in plaintext output")
		.optional(),
});

const seasonsOutputSchema = z.object({
	showId: z.number(),
	seasons: z.array(seasonSchema),
});

const episodesInputSchema = z.object({
	seasonId: z.number().int().positive().describe("TVMaze season ID e.g. /seasons/{id}"),
	includeGuestCast: z.boolean().default(false),
	previewLimit: z
		.number()
		.int()
		.min(1)
		.max(20)
		.default(5)
		.describe("Number of episodes to highlight in plaintext output")
		.optional(),
});

const episodesOutputSchema = z.object({
	seasonId: z.number(),
	includeGuestCast: z.boolean(),
	episodes: z.array(episodeSchema),
});

type SearchOutput = z.infer<typeof searchOutputSchema>;
type ShowDetailsOutput = z.infer<typeof showDetailsOutputSchema>;
type CastCrewOutput = z.infer<typeof castCrewOutputSchema>;
type SeasonsOutput = z.infer<typeof seasonsOutputSchema>;
type EpisodesOutput = z.infer<typeof episodesOutputSchema>;

type TvMazeSearchResponse = Array<{
	score: number;
	show: {
		id: number;
		name: string;
		url: string;
		type?: string | null;
		language?: string | null;
		genres: string[];
		status?: string | null;
		premiered?: string | null;
		officialSite?: string | null;
		rating?: { average: number | null } | null;
		summary?: string | null;
	};
}>;

type TvMazeShowResponse = {
	id: number;
	name: string;
	url: string;
	type?: string | null;
	language?: string | null;
	genres: string[];
	status?: string | null;
	premiered?: string | null;
	officialSite?: string | null;
	rating?: { average: number | null } | null;
	summary?: string | null;
};

type TvMazeCastResponse = Array<{
	person: z.infer<typeof personSchema>;
	character?: z.infer<typeof characterSchema> | null;
	self?: boolean;
	voice?: boolean;
}>;

type TvMazeCrewResponse = Array<{
	type: string;
	person: z.infer<typeof personSchema>;
}>;

type TvMazeSeasonResponse = z.infer<typeof seasonSchema>[];
type TvMazeEpisodeResponse = z.infer<typeof episodeSchema>[];

const stripHtml = (value: string | null | undefined): string | null => {
	if (!value) {
		return null;
	}

	return value.replace(/<[^>]+>/g, "").trim() || null;
};

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "tvmaze-server",
		version: "0.1.0",
	});

	async init() {
		this.server.registerTool(
			"search_tv_shows",
			{
				title: "Search TV Shows",
				description: "Find shows using the TVMaze search API",
				inputSchema: searchInputSchema.shape,
				outputSchema: searchOutputSchema.shape,
			},
			async ({ query, limit = 5 }) => {
				const controller = new AbortController();
				const timeout = setTimeout(() => controller.abort(), 10_000);

				try {
					const url = new URL("https://api.tvmaze.com/search/shows");
					url.searchParams.set("q", query);

					const response = await fetch(url, {
						signal: controller.signal,
						headers: { "Accept-Encoding": "gzip, deflate" },
					});

					if (!response.ok) {
						throw new Error(`TVMaze responded with ${response.status}`);
					}

					const rawResults = (await response.json()) as TvMazeSearchResponse;
					const limited = rawResults.slice(0, limit);

					const normalized: SearchOutput = searchOutputSchema.parse({
						query,
						results: limited.map((item) => ({
							score: item.score,
							show: {
								...item.show,
								summary: stripHtml(item.show.summary),
							},
						})),
					});

					const lines = normalized.results.map((result) => {
						const show = result.show;
						return [
							`${show.name} (score ${result.score.toFixed(2)})`,
							`Genres: ${show.genres.join(", ") || "n/a"}`,
							show.language ? `Language: ${show.language}` : null,
							show.status ? `Status: ${show.status}` : null,
							show.rating?.average ? `Rating: ${show.rating.average}` : null,
							show.premiered ? `Premiered: ${show.premiered}` : null,
							show.officialSite ? `Official Site: ${show.officialSite}` : null,
							`URL: ${show.url}`,
							show.summary ? `Summary: ${show.summary}` : null,
						]
							.filter(Boolean)
							.join("\n");
					});

					return {
						content: [
							{
								type: "text",
								text: lines.join("\n\n") || "No results",
							},
						],
						structuredContent: normalized,
					};
				} catch (error) {
					if (error instanceof Error && error.name === "AbortError") {
						throw new Error("TVMaze request timed out");
					}

					throw error;
				} finally {
					clearTimeout(timeout);
				}
			},
		);

		this.server.registerTool(
			"get_tv_show",
			{
				title: "Get TV Show by ID",
				description: "Retrieve TV show metadata from TVMaze using its numeric ID",
				inputSchema: showDetailsInputSchema.shape,
				outputSchema: showDetailsOutputSchema.shape,
			},
			async ({ id }) => {
				const controller = new AbortController();
				const timeout = setTimeout(() => controller.abort(), 10_000);

				try {
					const response = await fetch(`https://api.tvmaze.com/shows/${id}`, {
						signal: controller.signal,
						headers: { "Accept-Encoding": "gzip, deflate" },
					});

					if (response.status === 404) {
						throw new Error(`TV show with ID ${id} was not found`);
					}

					if (!response.ok) {
						throw new Error(`TVMaze responded with ${response.status}`);
					}

					const data = (await response.json()) as TvMazeShowResponse;

					const normalized: ShowDetailsOutput = showDetailsOutputSchema.parse({
						show: {
							...data,
							summary: stripHtml(data.summary),
						},
					});

					const show = normalized.show;
					const lines = [
						`${show.name} (ID ${show.id})`,
						`Genres: ${show.genres.join(", ") || "n/a"}`,
						show.language ? `Language: ${show.language}` : null,
						show.status ? `Status: ${show.status}` : null,
						show.rating?.average ? `Rating: ${show.rating.average}` : null,
						show.premiered ? `Premiered: ${show.premiered}` : null,
						show.officialSite ? `Official Site: ${show.officialSite}` : null,
						`URL: ${show.url}`,
						show.summary ? `Summary: ${show.summary}` : null,
					]
						.filter(Boolean)
						.join("\n");

					return {
						content: [{ type: "text", text: lines }],
						structuredContent: normalized,
					};
				} catch (error) {
					if (error instanceof Error && error.name === "AbortError") {
						throw new Error("TVMaze request timed out");
					}

					throw error;
				} finally {
					clearTimeout(timeout);
				}
			},
		);

		this.server.registerTool(
			"get_tv_show_people",
			{
				title: "Get TV Show Cast & Crew",
				description: "Fetch cast and crew information for a given TVMaze show ID",
				inputSchema: castCrewInputSchema.shape,
				outputSchema: castCrewOutputSchema.shape,
			},
			async ({ id, castLimit = 5, crewLimit = 5 }) => {
				const controller = new AbortController();
				const timeout = setTimeout(() => controller.abort(), 10_000);

				try {
					const [castResponse, crewResponse] = await Promise.all([
						fetch(`https://api.tvmaze.com/shows/${id}/cast`, {
							signal: controller.signal,
							headers: { "Accept-Encoding": "gzip, deflate" },
						}),
						fetch(`https://api.tvmaze.com/shows/${id}/crew`, {
							signal: controller.signal,
							headers: { "Accept-Encoding": "gzip, deflate" },
						}),
					]);

					if (castResponse.status === 404 || crewResponse.status === 404) {
						throw new Error(`TV show with ID ${id} was not found`);
					}

					if (!castResponse.ok) {
						throw new Error(`TVMaze cast endpoint responded with ${castResponse.status}`);
					}

					if (!crewResponse.ok) {
						throw new Error(`TVMaze crew endpoint responded with ${crewResponse.status}`);
					}

					const [rawCast, rawCrew] = (await Promise.all([castResponse.json(), crewResponse.json()])) as [
						TvMazeCastResponse,
						TvMazeCrewResponse,
					];

					const normalized: CastCrewOutput = castCrewOutputSchema.parse({
						showId: id,
						cast: rawCast,
						crew: rawCrew,
					});

					const castLines = normalized.cast
						.slice(0, castLimit)
						.map((entry) => {
							const actor = entry.person.name;
							const role = entry.character?.name ? ` as ${entry.character.name}` : "";
							const flags = [entry.self ? "self" : null, entry.voice ? "voice" : null].filter(Boolean).join(", ");
							const extras = flags ? ` (${flags})` : "";
							return `- ${actor}${role}${extras}`;
						})
						.join("\n");

					const crewLines = normalized.crew
						.slice(0, crewLimit)
						.map((entry) => `- ${entry.person.name} — ${entry.type}`)
						.join("\n");

					const textChunks = [
						`Cast (${normalized.cast.length} total):`,
						castLines || "- None listed",
						"",
						`Crew (${normalized.crew.length} total):`,
						crewLines || "- None listed",
					];

					return {
						content: [{ type: "text", text: textChunks.join("\n") }],
						structuredContent: normalized,
					};
				} catch (error) {
					if (error instanceof Error && error.name === "AbortError") {
						throw new Error("TVMaze request timed out");
					}

					throw error;
				} finally {
					clearTimeout(timeout);
				}
			},
		);

		this.server.registerTool(
			"get_tv_show_seasons",
			{
				title: "Get TV Show Seasons",
				description: "List all seasons for a TVMaze show ID",
				inputSchema: seasonsInputSchema.shape,
				outputSchema: seasonsOutputSchema.shape,
			},
			async ({ showId, previewLimit = 5 }) => {
				const controller = new AbortController();
				const timeout = setTimeout(() => controller.abort(), 10_000);

				try {
					const response = await fetch(`https://api.tvmaze.com/shows/${showId}/seasons`, {
						signal: controller.signal,
						headers: { "Accept-Encoding": "gzip, deflate" },
					});

					if (response.status === 404) {
						throw new Error(`TV show with ID ${showId} was not found`);
					}

					if (!response.ok) {
						throw new Error(`TVMaze seasons endpoint responded with ${response.status}`);
					}

					const rawSeasons = (await response.json()) as TvMazeSeasonResponse;
					const normalized: SeasonsOutput = seasonsOutputSchema.parse({
						showId,
						seasons: rawSeasons.map((season) => ({
							...season,
							summary: stripHtml(season.summary),
						})),
					});

					const preview = normalized.seasons
						.slice(0, previewLimit)
						.map((season) => {
							const label = season.number !== null ? `Season ${season.number}` : "Season";
							const title = season.name ? ` — ${season.name}` : "";
							const dates = season.premiereDate || season.endDate ? ` (${season.premiereDate || "?"} – ${season.endDate || "?"})` : "";
							const episodes =
								season.episodeOrder !== null && season.episodeOrder !== undefined
									? ` • ${season.episodeOrder} episodes`
									: "";
							return `- ${label}${title}${dates}${episodes}`;
						})
						.join("\n");

					return {
						content: [
							{
								type: "text",
								text: [`Seasons for show ${showId} (${normalized.seasons.length} total):`, preview || "- None found"].join("\n"),
							},
						],
						structuredContent: normalized,
					};
				} catch (error) {
					if (error instanceof Error && error.name === "AbortError") {
						throw new Error("TVMaze request timed out");
					}

					throw error;
				} finally {
					clearTimeout(timeout);
				}
			},
		);

		this.server.registerTool(
			"get_season_episodes",
			{
				title: "Get Season Episodes",
				description: "List episodes for a TVMaze season ID, optionally including guest cast information",
				inputSchema: episodesInputSchema.shape,
				outputSchema: episodesOutputSchema.shape,
			},
			async ({ seasonId, includeGuestCast = false, previewLimit = 5 }) => {
				const controller = new AbortController();
				const timeout = setTimeout(() => controller.abort(), 10_000);

				try {
					const url = new URL(`https://api.tvmaze.com/seasons/${seasonId}/episodes`);
					if (includeGuestCast) {
						url.searchParams.set("embed", "guestcast");
					}

					const response = await fetch(url, {
						signal: controller.signal,
						headers: { "Accept-Encoding": "gzip, deflate" },
					});

					if (response.status === 404) {
						throw new Error(`Season with ID ${seasonId} was not found`);
					}

					if (!response.ok) {
						throw new Error(`TVMaze episodes endpoint responded with ${response.status}`);
					}

					const rawEpisodes = (await response.json()) as TvMazeEpisodeResponse;
					const normalized: EpisodesOutput = episodesOutputSchema.parse({
						seasonId,
						includeGuestCast,
						episodes: rawEpisodes.map((episode) => ({
							...episode,
							summary: stripHtml(episode.summary),
						})),
					});

					const preview = normalized.episodes
						.slice(0, previewLimit)
						.map((episode) => {
							const number = episode.number !== null && episode.number !== undefined ? `E${episode.number.toString().padStart(2, "0")}` : "Episode";
							const rating =
								episode.rating?.average !== null && episode.rating?.average !== undefined ? ` • Rating: ${episode.rating.average}` : "";
							const guestCount = includeGuestCast && episode._embedded?.guestcast ? ` • Guest Cast: ${episode._embedded.guestcast.length}` : "";
							return `- ${number}: ${episode.name || "Untitled"} (${episode.airdate || "?"})${rating}${guestCount}`;
						})
						.join("\n");

					return {
						content: [
							{
								type: "text",
								text: [`Episodes for season ${seasonId} (${normalized.episodes.length} total):`, preview || "- None found"].join("\n"),
							},
						],
						structuredContent: normalized,
					};
				} catch (error) {
					if (error instanceof Error && error.name === "AbortError") {
						throw new Error("TVMaze request timed out");
					}

					throw error;
				} finally {
					clearTimeout(timeout);
				}
			},
		);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response(
			["TVMaze MCP server ready.", "Start via Wrangler dev or deploy to Cloudflare Workers.", ...endpointLines].join("\n"),
			{ status: 200 },
		);
	},
};

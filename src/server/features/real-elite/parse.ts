export type CrawlSnapshot = {
  source: string;
  refreshedAt: string;
  site: string;
  auditId: string;
  status: string;
  pagesCrawled: number;
  pagesLimit: number;
  missingTitles: number;
  missingDescriptions: number;
  duplicateTitles: number;
  duplicateDescriptions: number;
  lighthouseRuns: number;
  notInSitemap: string[];
  serviceUrlsOutsideThisCrawl: string[];
};

export type LocalGridRow = {
  keyword: string;
  grid: string;
  points: number | null;
  ranked: number | null;
  centerLeader: string | null;
};

export type LocalGridsSnapshot = {
  source: string;
  refreshedAt: string;
  note: string;
  rows: LocalGridRow[];
};

export type ListingSnapshot = {
  source: string;
  refreshedAt: string;
  name: string;
  category: string;
  phone: string;
  claimed: boolean;
  reviewCount: number;
  rating: number;
  address: string | null;
  website: string;
};

export type FrozenSearchSnapshot = {
  source: string;
  refreshedAt: string;
  device: string;
  windowStart: string;
  windowEnd: string;
  clicks: number;
  impressions: number;
};

export type BaselineFile = {
  crawl: CrawlSnapshot | null;
  localGrids: LocalGridsSnapshot | null;
  listingSnapshot: ListingSnapshot | null;
  searchConsoleMobileFrozen: FrozenSearchSnapshot | null;
};

export type ActionItem = {
  identifier: string;
  title: string;
  status: string;
  assignee: string;
  verifyStep: string | null;
};

export type GoogleWidget = {
  state: "disconnected" | "no_data" | "ok" | "error";
  detail: string | null;
  refreshedAt: string | null;
  summary: string | null;
};

/** Paperclip statuses that are no longer open work. */
const TERMINAL_ACTION_STATUSES = new Set(["done", "cancelled"]);

export function countOpenActionItems(
  items: readonly { status: string }[],
): number {
  return items.filter((item) => !TERMINAL_ACTION_STATUSES.has(item.status))
    .length;
}

const PLANNED_PAID = [
  {
    title: "Keyword research",
    detail: "DataForSEO. Disabled.",
  },
  {
    title: "Rank tracking",
    detail: "DataForSEO. Disabled.",
  },
  {
    title: "Domain overview and competitors",
    detail: "DataForSEO. Disabled.",
  },
  {
    title: "Backlinks",
    detail: "DataForSEO. Disabled.",
  },
  {
    title: "AI visibility (brand lookup and prompt explorer)",
    detail: "DataForSEO. Disabled.",
  },
  {
    title: "New local Maps grids",
    detail: "DataForSEO. Disabled. The 2026-10-01 grids stay as a labeled snapshot.",
  },
  {
    title: "SAM in-app agent",
    detail: "OpenRouter is pay-per-use. Disabled.",
  },
] as const;

export function plannedPaidFeatures() {
  return PLANNED_PAID;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function strList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function parseCrawl(value: unknown): CrawlSnapshot | null {
  if (!isRecord(value)) return null;
  const source = str(value.source);
  const refreshedAt = str(value.refreshedAt);
  const site = str(value.site);
  const auditId = str(value.auditId);
  const status = str(value.status);
  const pagesCrawled = num(value.pagesCrawled);
  const pagesLimit = num(value.pagesLimit);
  const missingTitles = num(value.missingTitles);
  const missingDescriptions = num(value.missingDescriptions);
  const duplicateTitles = num(value.duplicateTitles);
  const duplicateDescriptions = num(value.duplicateDescriptions);
  const lighthouseRuns = num(value.lighthouseRuns);
  if (
    !source ||
    !refreshedAt ||
    !site ||
    !auditId ||
    !status ||
    pagesCrawled === null ||
    pagesLimit === null ||
    missingTitles === null ||
    missingDescriptions === null ||
    duplicateTitles === null ||
    duplicateDescriptions === null ||
    lighthouseRuns === null
  ) {
    return null;
  }
  return {
    source,
    refreshedAt,
    site,
    auditId,
    status,
    pagesCrawled,
    pagesLimit,
    missingTitles,
    missingDescriptions,
    duplicateTitles,
    duplicateDescriptions,
    lighthouseRuns,
    notInSitemap: strList(value.notInSitemap),
    serviceUrlsOutsideThisCrawl: strList(value.serviceUrlsOutsideThisCrawl),
  };
}

function parseRow(value: unknown): LocalGridRow | null {
  if (!isRecord(value)) return null;
  const keyword = str(value.keyword);
  const grid = str(value.grid);
  if (!keyword || !grid) return null;
  const points = value.points === null ? null : num(value.points);
  const ranked = value.ranked === null ? null : num(value.ranked);
  if (value.points !== null && points === null) return null;
  if (value.ranked !== null && ranked === null) return null;
  const centerLeader =
    value.centerLeader === null ? null : str(value.centerLeader);
  return { keyword, grid, points, ranked, centerLeader };
}

function parseGrids(value: unknown): LocalGridsSnapshot | null {
  if (!isRecord(value) || !Array.isArray(value.rows)) return null;
  const source = str(value.source);
  const refreshedAt = str(value.refreshedAt);
  const note = str(value.note);
  if (!source || !refreshedAt || !note) return null;
  const rows = value.rows.map(parseRow).filter((row) => row !== null);
  if (rows.length !== value.rows.length) return null;
  return { source, refreshedAt, note, rows };
}

function parseListing(value: unknown): ListingSnapshot | null {
  if (!isRecord(value)) return null;
  const source = str(value.source);
  const refreshedAt = str(value.refreshedAt);
  const name = str(value.name);
  const category = str(value.category);
  const phone = str(value.phone);
  const website = str(value.website);
  const reviewCount = num(value.reviewCount);
  const rating = num(value.rating);
  if (
    !source ||
    !refreshedAt ||
    !name ||
    !category ||
    !phone ||
    !website ||
    reviewCount === null ||
    rating === null ||
    typeof value.claimed !== "boolean"
  ) {
    return null;
  }
  const address = value.address === null ? null : str(value.address);
  return {
    source,
    refreshedAt,
    name,
    category,
    phone,
    claimed: value.claimed,
    reviewCount,
    rating,
    address,
    website,
  };
}

function parseFrozen(value: unknown): FrozenSearchSnapshot | null {
  if (!isRecord(value)) return null;
  const source = str(value.source);
  const refreshedAt = str(value.refreshedAt);
  const device = str(value.device);
  const windowStart = str(value.windowStart);
  const windowEnd = str(value.windowEnd);
  const clicks = num(value.clicks);
  const impressions = num(value.impressions);
  if (
    !source ||
    !refreshedAt ||
    !device ||
    !windowStart ||
    !windowEnd ||
    clicks === null ||
    impressions === null
  ) {
    return null;
  }
  return {
    source,
    refreshedAt,
    device,
    windowStart,
    windowEnd,
    clicks,
    impressions,
  };
}

export function parseBaseline(value: unknown): BaselineFile {
  const record = isRecord(value) ? value : {};
  return {
    crawl: parseCrawl(record.crawl),
    localGrids: parseGrids(record.localGrids),
    listingSnapshot: parseListing(record.listingSnapshot),
    searchConsoleMobileFrozen: parseFrozen(record.searchConsoleMobileFrozen),
  };
}

export function extractVerifyStep(
  description: string | null | undefined,
): string | null {
  if (!description) return null;
  const lines = description.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(
      /^\s*(?:[-*]|\d+[.)])?\s*verify(?:\s+step)?\s*[:\-–]\s*(.+)\s*$/i,
    );
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

export function mapActionItems(
  issues: unknown,
  agentNames: ReadonlyMap<string, string>,
): ActionItem[] {
  if (!Array.isArray(issues)) return [];
  const items: ActionItem[] = [];
  for (const issue of issues) {
    if (!isRecord(issue)) continue;
    const identifier = str(issue.identifier);
    const title = str(issue.title);
    const status = str(issue.status);
    if (!identifier || !title || !status) continue;
    const agentId = str(issue.assigneeAgentId);
    const userId = str(issue.assigneeUserId);
    let assignee = "Unassigned";
    if (agentId) assignee = agentNames.get(agentId) ?? agentId;
    else if (userId) assignee = "Board user";
    items.push({
      identifier,
      title,
      status,
      assignee,
      verifyStep: extractVerifyStep(
        typeof issue.description === "string" ? issue.description : null,
      ),
    });
  }
  return items;
}

export function googleOauthStatus(env: {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  BETTER_AUTH_SECRET?: string;
}): { oauth: "configured" | "missing"; missingEnv: string[] } {
  const missingEnv = (
    [
      ["GOOGLE_CLIENT_ID", env.GOOGLE_CLIENT_ID],
      ["GOOGLE_CLIENT_SECRET", env.GOOGLE_CLIENT_SECRET],
      ["BETTER_AUTH_SECRET", env.BETTER_AUTH_SECRET],
    ] as const
  )
    .filter(([, value]) => !value || value.trim() === "")
    .map(([name]) => name);
  return {
    oauth: missingEnv.length === 0 ? "configured" : "missing",
    missingEnv,
  };
}

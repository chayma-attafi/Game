const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export interface MatchData {
  matchId: number;
  matchName: string;
  blueTeam: string;
  redTeam: string;
  blueScore: number;
  redScore: number;
  totalVulnerabilities: number;
  acceptedVulnerabilities: number;
}

export interface ApiResponse {
  matches: MatchData[];
  timestamp: string;
  isDemo: boolean;
}

export interface TeamCount {
  team: string;
  vulnerabilities: number;
}

export interface TeamCountsResponse {
  redCounts: TeamCount[];
  blueCounts: TeamCount[];
  timestamp: string;
  isDemo: boolean;
}

export interface KpiSummary {
  totalFound: number;
  totalAccepted: number;
  totalRejected: number;
  totalBlueAttained: number;
  totalBlueNonAttained: number;
  totalRedFound: number;
  totalNewFindings: number;
  maxNewFindingsByTeam: number;
  newFindingsTopTeam: string;
  avgCoveragePct: number;
  leadingRedTeam: string;
  leadingRedAccepted: number;
  mostTargetedBlueTeam: string;
  mostTargetedBlueCount: number;
}

export interface RedLeaderboardItem {
  team: string;
  vulnerabilities: number;
  accepted: number;
  rejected: number;
  pending: number;
  targetsCovered: number;
  yesCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  highAcceptedCount: number;
  mediumAcceptedCount: number;
  lowAcceptedCount: number;
  newAcceptedCount: number;
  finalScore: number;
}

export interface BlueRiskItem {
  team: string;
  vulnerabilities: number;
  redFound: number;
  accepted: number;
  rejected: number;
  pending: number;
  blueSubmissions: number;
  projectDemo: string;
  blueAttained: number;
  blueNonAttained: number;
  coveragePct: number;
  newFindingsByRed: number;
}

export interface MatrixRow {
  redTeam: string;
  values: number[];
}

export interface DashboardSummaryResponse {
  kpis: KpiSummary;
  redLeaderboard: RedLeaderboardItem[];
  blueRisk: BlueRiskItem[];
  matrix: MatrixRow[];
  matches: MatchData[];
  timestamp: string;
  blueSheetWarning: string;
}

function assertApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL is not configured");
  }
}

function normalizeTeamCounts(raw: unknown, size: number, prefix: string): TeamCount[] {
  const data = Array.isArray(raw) ? raw : [];
  const normalized = Array.from({ length: size }, (_, i) => ({
    team: `${prefix} ${i + 1}`,
    vulnerabilities: 0,
  }));

  data.forEach((item, index) => {
    if (index >= size) return;
    if (!item || typeof item !== "object") return;

    const maybeTeam = (item as { team?: unknown }).team;
    const maybeVulnerabilities = (item as { vulnerabilities?: unknown }).vulnerabilities;

    normalized[index] = {
      team: typeof maybeTeam === "string" && maybeTeam ? maybeTeam : `${prefix} ${index + 1}`,
      vulnerabilities: Number.isNaN(Number(maybeVulnerabilities)) ? 0 : Number(maybeVulnerabilities),
    };
  });

  return normalized;
}

export async function fetchDashboardSummary(): Promise<DashboardSummaryResponse> {
  assertApiBaseUrl();

  const response = await fetch(`${API_BASE_URL}/api/dashboard-summary`);
  if (!response.ok) throw new Error("Dashboard summary API error");

  const data = await response.json();
  return {
    kpis: data.kpis,
    redLeaderboard: Array.isArray(data.redLeaderboard) ? data.redLeaderboard : [],
    blueRisk: Array.isArray(data.blueRisk) ? data.blueRisk : [],
    matrix: Array.isArray(data.matrix) ? data.matrix : [],
    matches: Array.isArray(data.matches) ? data.matches : [],
    timestamp: data.timestamp || new Date().toISOString(),
    blueSheetWarning: typeof data.blueSheetWarning === "string" ? data.blueSheetWarning : "",
  };
}

export async function fetchMatches(): Promise<ApiResponse> {
  assertApiBaseUrl();

  const response = await fetch(`${API_BASE_URL}/api/matches`);
  if (!response.ok) throw new Error("API error");
  return await response.json();
}

export async function fetchTeamCounts(): Promise<TeamCountsResponse> {
  assertApiBaseUrl();

  const response = await fetch(`${API_BASE_URL}/api/team-counts`);
  if (!response.ok) throw new Error("API error");

  const data = await response.json();
  return {
    redCounts: normalizeTeamCounts(data.redCounts, 4, "Hackers"),
    blueCounts: normalizeTeamCounts(data.blueCounts, 12, "Blue"),
    timestamp: data.timestamp || new Date().toISOString(),
    isDemo: false,
  };
}

export function getWinner(match: MatchData): "blue" | "red" | "tie" {
  if (match.blueScore > match.redScore) return "blue";
  if (match.redScore > match.blueScore) return "red";
  return "tie";
}








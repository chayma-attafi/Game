import express from "express";
import cors from "cors";

const app = express();

const PORT = Number(process.env.PORT || 8080);

const RED_SHEET_ID = process.env.GOOGLE_SHEET_ID || "1tySU7_QLwSFBKSdru_9mNqsG020NLm6pQ7_EAYn-c7U";
const RED_SHEET_GID = process.env.GOOGLE_SHEET_GID || "991151321";
const RED_SHEET_RANGE = process.env.GOOGLE_SHEET_RANGE || "";

const BLUE_SHEET_ID = process.env.BLUE_SHEET_ID || "1I9_GCZ0FGspgRfvxD51psUM977Bd7dY7apdtl2aysPg";
const BLUE_SHEET_GID = process.env.BLUE_SHEET_GID || "837421844";
const BLUE_SHEET_RANGE = process.env.BLUE_SHEET_RANGE || "";

app.use(cors());
app.use(express.json());

function normalizeHeader(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTeamNumber(value) {
  const match = String(value || "").match(/(\d+)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseNumericValue(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isNaN(value) ? 0 : value;
  const match = String(value).replace(",", ".").match(/-?\d+(?:\.\d+)?/);
  if (!match) return 0;
  const parsed = Number(match[0]);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function parseGoogleVisualizationJson(raw) {
  const firstParen = raw.indexOf("(");
  const lastParen = raw.lastIndexOf(")");
  if (firstParen === -1 || lastParen === -1) {
    throw new Error("Unexpected Google Sheets response format");
  }
  const jsonText = raw.slice(firstParen + 1, lastParen);
  return JSON.parse(jsonText);
}

function getColumnIndexByAlias(headers, aliases) {
  for (let i = 0; i < headers.length; i += 1) {
    const current = headers[i];
    if (aliases.some((alias) => current.includes(alias))) {
      return i;
    }
  }
  return -1;
}

function normalizeYesNo(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (['yes', 'oui', 'true', '1', 'y'].includes(raw)) return 'yes';
  if (['no', 'non', 'false', '0', 'n'].includes(raw)) return 'no';
  return 'unknown';
}

function normalizeSeverity(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw.includes("high") || raw.includes("haute")) return "high";
  if (raw.includes("medium") || raw.includes("meduim") || raw.includes("moy")) return "medium";
  if (raw.includes("low") || raw.includes("faible")) return "low";
  return "unknown";
}

function normalizeStatus(value) {
  const raw = String(value || "").trim().toUpperCase();
  if (raw.startsWith("ACCEPT") || raw.startsWith("APPROV")) return "accepted";
  if (raw.startsWith("REJECT") || raw.startsWith("REJET") || raw.startsWith("REFUS")) return "rejected";
  return "pending";
}

async function readSheetRows(sheetId, gid, range) {
  const queryPart = range ? `&range=${encodeURIComponent(range)}` : "";
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?gid=${gid}&tqx=out:json${queryPart}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google Sheets request failed (${response.status})`);
  }

  const text = await response.text();
  const parsed = parseGoogleVisualizationJson(text);
  const cols = parsed?.table?.cols || [];
  const rows = parsed?.table?.rows || [];

  const headers = cols.map((col) => normalizeHeader(col?.label || col?.id || ""));
  const mappedRows = rows.map((row) => (row?.c || []).map((cell) => (cell ? cell.v : null)));

  return { headers, rows: mappedRows };
}

function aggregateRedSheet(headers, rows) {
  const redCol = getColumnIndexByAlias(headers, ["votre equipe", "red team", "equipe red"]);
  const blueCol = getColumnIndexByAlias(headers, ["equipes cibles", "blue team", "target blue"]);
  const statusCol = getColumnIndexByAlias(headers, ["status", "statut", "validation"]);
  const newVulnCol = getColumnIndexByAlias(headers, ["new vulnarabilite", "new vulnerabilite", "new vulnerability", "nouvelle vulnerabilite"]);
  let severityCol = getColumnIndexByAlias(headers, ["criticite", "severity", "criticality"]);
  if (severityCol === -1 && rows.some((r) => Array.isArray(r) && r.length > 21)) severityCol = 21;

  if (redCol === -1 || blueCol === -1) {
    throw new Error("Required columns were not found in the red sheet");
  }

  const redLeaderboard = Array.from({ length: 4 }, (_, i) => ({
    team: `Hackers ${i + 1}`,
    vulnerabilities: 0,
    accepted: 0,
    rejected: 0,
    pending: 0,
    targetsCovered: 0,
    yesCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    highAcceptedCount: 0,
    mediumAcceptedCount: 0,
    lowAcceptedCount: 0,
    newAcceptedCount: 0,
    finalScore: 0,
    _targets: new Set(),
  }));

  const blueRisk = Array.from({ length: 12 }, (_, i) => ({
    team: `Blue ${i + 1}`,
    vulnerabilities: 0,
    redFound: 0,
    accepted: 0,
    rejected: 0,
    pending: 0,
  }));

  let totalNewFindingsYes = 0;
  const newFindingsYesByTeam = Array.from({ length: 4 }, () => 0);

  const matrix = Array.from({ length: 4 }, (_, redIdx) => ({
    redTeam: `Hackers ${redIdx + 1}`,
    values: Array.from({ length: 12 }, () => 0),
  }));

  rows.forEach((row) => {
    const redTeamNumber = extractTeamNumber(row[redCol]);
    const blueTeamNumber = extractTeamNumber(row[blueCol]);
    if (!redTeamNumber || redTeamNumber < 1 || redTeamNumber > 4) return;
    if (!blueTeamNumber || blueTeamNumber < 1 || blueTeamNumber > 12) return;

    const status = statusCol >= 0 ? normalizeStatus(row[statusCol]) : "accepted";
    const newVuln = newVulnCol >= 0 ? normalizeYesNo(row[newVulnCol]) : "unknown";
    const severity = severityCol >= 0 ? normalizeSeverity(row[severityCol]) : "unknown";

    const redRef = redLeaderboard[redTeamNumber - 1];
    const blueRef = blueRisk[blueTeamNumber - 1];

    redRef.vulnerabilities += 1;
    blueRef.vulnerabilities += 1;
    blueRef.redFound += 1;
    redRef._targets.add(blueTeamNumber);
    matrix[redTeamNumber - 1].values[blueTeamNumber - 1] += 1;

    if (newVuln === "yes") {
      totalNewFindingsYes += 1;
      newFindingsYesByTeam[redTeamNumber - 1] += 1;
      redRef.yesCount += 1;
    }

    if (severity === "high") redRef.highCount += 1;
    if (severity === "medium") redRef.mediumCount += 1;
    if (severity === "low") redRef.lowCount += 1;

    if (status === "accepted") {
      redRef.accepted += 1;
      blueRef.accepted += 1;
      if (severity === "high") redRef.highAcceptedCount += 1;
      if (severity === "medium") redRef.mediumAcceptedCount += 1;
      if (severity === "low") redRef.lowAcceptedCount += 1;
      if (newVuln === "yes") redRef.newAcceptedCount += 1;
    } else if (status === "rejected") {
      redRef.rejected += 1;
      blueRef.rejected += 1;
    } else {
      redRef.pending += 1;
      blueRef.pending += 1;
    }
  });

  redLeaderboard.forEach((row) => {
    row.targetsCovered = row._targets.size;
    row.finalScore = (row.highAcceptedCount * 7) + (row.mediumAcceptedCount * 4) + (row.lowAcceptedCount * 2) + (row.newAcceptedCount * 2);
    delete row._targets;
  });

  return { redLeaderboard, blueRisk, matrix, totalNewFindingsYes, newFindingsYesByTeam };
}

function aggregateBlueSheet(headers, rows) {
  const blueCol = getColumnIndexByAlias(headers, ["votre equipe", "blue team", "equipe"]);
  const attainedCol = getColumnIndexByAlias(headers, ["nombre de vulnerabilites atteintes", "vulnerabilites atteintes", "atteintes"]);
  const nonAttainedCol = getColumnIndexByAlias(headers, ["nombre de vulnerabilites non atteintes", "vulnerabilites non atteintes", "non atteintes"]);
  const projectDemoCol = getColumnIndexByAlias(headers, ["projectdemo", "description du projet", "projet"]);

  const blueMeta = new Map();
  if (blueCol === -1) return blueMeta;

  rows.forEach((row) => {
    const blueTeamNumber = extractTeamNumber(row[blueCol]);
    if (!blueTeamNumber || blueTeamNumber < 1 || blueTeamNumber > 12) return;

    const current = blueMeta.get(blueTeamNumber) || {
      submissions: 0,
      blueAttained: 0,
      blueNonAttained: 0,
      projectDemo: "",
    };

    current.submissions += 1;
    if (attainedCol >= 0) current.blueAttained += parseNumericValue(row[attainedCol]);
    if (nonAttainedCol >= 0) current.blueNonAttained += parseNumericValue(row[nonAttainedCol]);

    if (projectDemoCol >= 0) {
      const raw = String(row[projectDemoCol] || "").trim();
      if (raw && !current.projectDemo) current.projectDemo = raw;
    }

    blueMeta.set(blueTeamNumber, current);
  });

  return blueMeta;
}

function buildMatchesFromLeaderboard(redLeaderboard, matrix, blueRisk) {
  return redLeaderboard.map((r, i) => {
    const row = matrix[i]?.values || [];
    let bestBlueIndex = 0;
    let bestCount = -1;

    for (let idx = 0; idx < row.length; idx += 1) {
      if (row[idx] > bestCount) {
        bestCount = row[idx];
        bestBlueIndex = idx;
      }
    }

    const attackedBlue = blueRisk[bestBlueIndex] || { blueAttained: 0, blueNonAttained: 0 };
    const blueReported = Number(attackedBlue.blueAttained || 0) + Number(attackedBlue.blueNonAttained || 0);

    const found = Number(r.vulnerabilities || 0);
    const rejected = Number(r.rejected || 0);
    const score = Math.max(0, found - rejected);

    const redScore = score;
    const blueScore = Math.max(0, blueReported - score);

    return {
      matchId: i + 1,
      matchName: `Screen ${i + 1}`,
      blueTeam: `Blue Team ${bestBlueIndex + 1}`,
      redTeam: `Hackers Team ${i + 1}`,
      blueScore,
      redScore,
      totalVulnerabilities: blueReported,
      acceptedVulnerabilities: found,
    };
  });
}

function buildKpis(redLeaderboard, blueRisk, totalNewFindingsFromRedSheet = 0, newFindingsYesByTeam = []) {
  const totalFound = redLeaderboard.reduce((sum, item) => sum + item.vulnerabilities, 0);
  const totalAccepted = redLeaderboard.reduce((sum, item) => sum + item.accepted, 0);
  const totalRejected = redLeaderboard.reduce((sum, item) => sum + item.rejected, 0);

  const totalBlueAttained = blueRisk.reduce((sum, row) => sum + row.blueAttained, 0);
  const totalBlueNonAttained = blueRisk.reduce((sum, row) => sum + row.blueNonAttained, 0);
  const totalRedFound = blueRisk.reduce((sum, row) => sum + row.redFound, 0);
  const totalNewFindings = Number(totalNewFindingsFromRedSheet) || 0;
  const normalizedByTeam = Array.from({ length: 4 }, (_, i) => Number(newFindingsYesByTeam[i] || 0));
  const maxNewFindingsByTeam = normalizedByTeam.length ? Math.max(...normalizedByTeam) : 0;
  const topNewFindingsTeams = normalizedByTeam
    .map((count, i) => ({ team: `Hackers ${i + 1}`, count }))
    .filter((item) => maxNewFindingsByTeam > 0 && item.count === maxNewFindingsByTeam);
  const newFindingsTopTeam = topNewFindingsTeams.length === 0 ? "-" : topNewFindingsTeams.map((item) => item.team).join(" / ");

  const coverageRows = blueRisk.filter((row) => row.blueAttained > 0);
  const avgCoveragePct = coverageRows.length
    ? coverageRows.reduce((sum, row) => sum + row.coveragePct, 0) / coverageRows.length
    : 0;

  const maxAccepted = redLeaderboard.length ? Math.max(...redLeaderboard.map((r) => Number(r.accepted || 0))) : 0;
  const leadingRedTeams = redLeaderboard.filter((r) => Number(r.accepted || 0) === maxAccepted).map((r) => r.team);
  const leadingRedTeamLabel = maxAccepted > 0 ? leadingRedTeams.join(" / ") : "-";
  const mostTargetedBlue = [...blueRisk].sort((a, b) => b.redFound - a.redFound)[0];

  return {
    totalFound,
    totalAccepted,
    totalRejected,
    totalBlueAttained,
    totalBlueNonAttained,
    totalRedFound,
    totalNewFindings,
    maxNewFindingsByTeam,
    newFindingsTopTeam,
    avgCoveragePct: Number(avgCoveragePct.toFixed(1)),
    leadingRedTeam: leadingRedTeamLabel,
    leadingRedAccepted: maxAccepted || 0,
    mostTargetedBlueTeam: mostTargetedBlue?.team || "-",
    mostTargetedBlueCount: mostTargetedBlue?.redFound || 0,
  };
}

async function buildDashboardSummary() {
  const redSheet = await readSheetRows(RED_SHEET_ID, RED_SHEET_GID, RED_SHEET_RANGE);

  let blueSheet = { headers: [], rows: [] };
  let blueSheetWarning = "";
  try {
    blueSheet = await readSheetRows(BLUE_SHEET_ID, BLUE_SHEET_GID, BLUE_SHEET_RANGE);
  } catch (error) {
    blueSheetWarning = error instanceof Error ? error.message : String(error);
  }

  const redAgg = aggregateRedSheet(redSheet.headers, redSheet.rows);
  const blueMeta = aggregateBlueSheet(blueSheet.headers, blueSheet.rows);

  const blueRisk = redAgg.blueRisk.map((row, index) => {
    const meta = blueMeta.get(index + 1) || { submissions: 0, blueAttained: 0, blueNonAttained: 0, projectDemo: "" };
    const redFound = row.redFound;
    const blueAttained = meta.blueAttained;
    const coveragePct = blueAttained > 0 ? (redFound / blueAttained) * 100 : 0;
    const newFindingsByRed = Math.max(0, redFound - blueAttained);

    return {
      ...row,
      redFound,
      blueAttained,
      blueNonAttained: meta.blueNonAttained,
      coveragePct: Number(coveragePct.toFixed(1)),
      newFindingsByRed,
      blueSubmissions: meta.submissions,
      projectDemo: meta.projectDemo,
    };
  });

  const redLeaderboard = redAgg.redLeaderboard;
  const matrix = redAgg.matrix;
  const matches = buildMatchesFromLeaderboard(redLeaderboard, matrix, blueRisk);
  const kpis = buildKpis(redLeaderboard, blueRisk, redAgg.totalNewFindingsYes, redAgg.newFindingsYesByTeam);

  return {
    kpis,
    redLeaderboard,
    blueRisk,
    matrix,
    matches,
    timestamp: new Date().toISOString(),
    source: "google-sheets",
    blueSheetWarning,
    redSheet: { sheetId: RED_SHEET_ID, gid: RED_SHEET_GID },
    blueSheet: { sheetId: BLUE_SHEET_ID, gid: BLUE_SHEET_GID },
  };
}

app.get("/api/dashboard-summary", async (_req, res) => {
  try {
    const summary = await buildDashboardSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({
      error: "Failed to build dashboard summary",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/api/matches", async (_req, res) => {
  try {
    const summary = await buildDashboardSummary();
    res.json({
      matches: summary.matches,
      timestamp: summary.timestamp,
      isDemo: false,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to read Google Sheet for matches",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/api/team-counts", async (_req, res) => {
  try {
    const summary = await buildDashboardSummary();
    res.json({
      redCounts: summary.redLeaderboard.map((row) => ({
        team: row.team,
        vulnerabilities: row.vulnerabilities,
      })),
      blueCounts: summary.blueRisk.map((row) => ({
        team: row.team,
        vulnerabilities: row.redFound,
      })),
      timestamp: summary.timestamp,
      source: summary.source,
      redSheet: summary.redSheet,
      blueSheet: summary.blueSheet,
      blueSheetWarning: summary.blueSheetWarning,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to read Google Sheet",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${PORT}`);
});


















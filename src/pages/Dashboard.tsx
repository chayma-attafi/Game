import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import MatchPanel from "@/components/MatchPanel";
import {
  fetchDashboardSummary,
  type MatchData,
  type KpiSummary,
  type MatrixRow,
  type RedLeaderboardItem,
  type BlueRiskItem,
} from "@/services/api";
import talanLogo from "@/assets/talan-logo.jpg";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { playClickSfx } from "@/lib/sfx";

const POLL_INTERVAL = 5000;

const initialKpis: KpiSummary = {
  totalFound: 0,
  totalAccepted: 0,
  totalRejected: 0,
  totalBlueAttained: 0,
  totalBlueNonAttained: 0,
  totalRedFound: 0,
  totalNewFindings: 0,
  maxNewFindingsByTeam: 0,
  newFindingsTopTeam: "-",
  avgCoveragePct: 0,
  leadingRedTeam: "-",
  leadingRedAccepted: 0,
  mostTargetedBlueTeam: "-",
  mostTargetedBlueCount: 0,
};

const Dashboard = () => {
  const navigate = useNavigate();

  const [matches, setMatches] = useState<MatchData[]>([]);
  const [kpis, setKpis] = useState<KpiSummary>(initialKpis);
  const [redLeaderboard, setRedLeaderboard] = useState<RedLeaderboardItem[]>([]);
  const [blueRisk, setBlueRisk] = useState<BlueRiskItem[]>([]);
  const [matrix, setMatrix] = useState<MatrixRow[]>([]);

  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const maxMatrixValue = useMemo(() => {
    let max = 0;
    matrix.forEach((row) => {
      row.values.forEach((value) => {
        if (value > max) max = value;
      });
    });
    return max;
  }, [matrix]);

  const redChartConfig = {
    vulnerabilities: {
      label: "Vulnerabilities",
      color: "hsl(var(--red-team))",
    },
  } satisfies ChartConfig;

  useEffect(() => {
    const load = async () => {
      try {
        const summary = await fetchDashboardSummary();
        setKpis(summary.kpis);
        setRedLeaderboard(summary.redLeaderboard || []);
        setBlueRisk(summary.blueRisk || []);
        setMatrix(summary.matrix || []);
        setMatches(summary.matches || []);
      } finally {
        setIsLoading(false);
        setLastUpdate(new Date().toLocaleTimeString());
      }
    };

    load();
    intervalRef.current = setInterval(load, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, []);

  const matrixCellStyle = (value: number) => {
    if (maxMatrixValue <= 0 || value <= 0) {
      return { backgroundColor: "transparent" };
    }
    const alpha = Math.max(0.15, value / maxMatrixValue);
    return { backgroundColor: `hsl(var(--red-team) / ${alpha})` };
  };

  const maxBlueAttained = blueRisk.length ? Math.max(...blueRisk.map((b) => b.blueAttained || 0)) : 0;
  const topBlueTeams = blueRisk.filter((b) => maxBlueAttained > 0 && (b.blueAttained || 0) === maxBlueAttained);

  const blueLeaderLabel =
    topBlueTeams.length > 1
      ? "Top Blue Teams (Tie)"
      : topBlueTeams.length === 1
      ? `${topBlueTeams[0].team} Leads`
      : "Top Blue Team";

  const blueLeaderSubtitle =
    topBlueTeams.length > 1 ? topBlueTeams.map((b) => b.team).join(" • ") : "Max Nombre de vulnérabilités Atteintes";

  const maxRedScore = redLeaderboard.length ? Math.max(...redLeaderboard.map((r) => r.finalScore || 0)) : 0;
  const topHackers = redLeaderboard.filter((r) => maxRedScore > 0 && (r.finalScore || 0) === maxRedScore);

  const topHackersLabel =
    topHackers.length > 1
      ? "Top Hackers (Tie)"
      : topHackers.length === 1
      ? `${topHackers[0].team} Leads`
      : "Top Hackers";

  const topHackersSubtitle =
    topHackers.length > 1 ? topHackers.map((t) => t.team).join(" • ") : "Final score";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => { playClickSfx(); navigate("/"); }} className="hover:opacity-80 transition-opacity">
              <img src={talanLogo} alt="Talan Tunisie" className="h-8" />
            </button>
            <div className="h-4 w-px bg-border" />
            <h1 className="font-display text-sm md:text-base font-bold tracking-widest uppercase text-foreground">
              <span className="text-blue-team">Blue</span>
              <span className="text-muted-foreground mx-2">vs</span>
              <span className="text-red-team">Red</span>
              <span className="text-muted-foreground ml-2">- Jury Live Screen</span>
            </h1>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
            <span className="text-xs text-muted-foreground font-body">Live - {lastUpdate}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Red Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-red-team">{kpis.totalRedFound}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Blue Attained</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-blue-team">{kpis.totalBlueAttained}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Top Accepted By Expert</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-1">{kpis.leadingRedTeam || "-"}</p>
              <p className="text-3xl font-black text-foreground">{kpis.leadingRedAccepted || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{
                kpis.newFindingsTopTeam && kpis.newFindingsTopTeam !== "-"
                  ? `New Findings By ${kpis.newFindingsTopTeam}`
                  : "New Findings By Red"
              }</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-red-team">{kpis.maxNewFindingsByTeam || 0}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6"
        >
          <Card className="border-red-team/30">
            <CardHeader>
              <CardTitle className="font-display text-red-team text-xl">Red Teams Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={redChartConfig} className="h-72 w-full aspect-auto">
                <BarChart data={redLeaderboard}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="team" />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="vulnerabilities" fill="var(--color-vulnerabilities)" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="border-red-team/30">
              <CardHeader>
                <CardTitle className="text-red-team">Top Hackers</CardTitle>
                <CardDescription>{topHackersLabel}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-black text-red-team">{maxRedScore}</p>
                <p>{topHackersSubtitle}</p>
              </CardContent>
            </Card>

            <Card className="border-blue-team/30">
              <CardHeader>
                <CardTitle className="text-blue-team">Top Blue Teams</CardTitle>
                <CardDescription>{blueLeaderLabel}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-black text-blue-team">{maxBlueAttained}</p>
                <p>{blueLeaderSubtitle}</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Red vs Blue Matrix</CardTitle>
              <CardDescription>Rows = Red teams, Columns = Blue apps, Value = findings count</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="sticky left-0 z-20 bg-card text-left py-2 px-3 font-semibold">Team</th>
                    {Array.from({ length: 12 }, (_, i) => (
                      <th key={i} className="text-center py-2 px-2 font-semibold">
                        B{i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((row, rowIndex) => {
                    const teamLabel = row.redTeam || `Team ${rowIndex + 1}`;
                    return (
                      <tr key={teamLabel} className="border-b border-border/60">
                        <td className="sticky left-0 z-10 bg-card py-2 px-3 font-medium">{teamLabel}</td>
                        {row.values.map((value, i) => (
                          <td
                            key={`${teamLabel}-${i}`}
                            className="py-2 px-2 text-center font-semibold"
                            style={matrixCellStyle(value)}
                          >
                            {value}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </motion.div>

        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.map((match, i) => (
              <MatchPanel key={match.matchId} match={match} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;








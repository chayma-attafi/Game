// import { useEffect, useMemo, useRef, useState } from "react";
// import { motion } from "framer-motion";
// import { useNavigate } from "react-router-dom";
// import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
// import MatchPanel from "@/components/MatchPanel";
// import FinalWinner from "@/components/FinalWinner";
// import {
//   fetchDashboardSummary,
//   type MatchData,
//   type KpiSummary,
//   type MatrixRow,
//   type RedLeaderboardItem,
//   type BlueRiskItem,
// } from "@/services/api";
// import talanLogo from "@/assets/talan-logo.jpg";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

// const POLL_INTERVAL = 5000;

// const initialKpis: KpiSummary = {
//   totalFound: 0,
//   totalAccepted: 0,
//   totalRejected: 0,
//   totalBlueAttained: 0,
//   totalBlueNonAttained: 0,
//   totalRedFound: 0,
//   totalNewFindings: 0,
//   avgCoveragePct: 0,
//   leadingRedTeam: "-",
//   leadingRedAccepted: 0,
//   mostTargetedBlueTeam: "-",
//   mostTargetedBlueCount: 0,
// };

// const Dashboard = () => {
//   const navigate = useNavigate();

//   const [matches, setMatches] = useState<MatchData[]>([]);
//   const [kpis, setKpis] = useState<KpiSummary>(initialKpis);
//   const [redLeaderboard, setRedLeaderboard] = useState<RedLeaderboardItem[]>([]);
//   const [blueRisk, setBlueRisk] = useState<BlueRiskItem[]>([]);
//   const [matrix, setMatrix] = useState<MatrixRow[]>([]);

//   const [lastUpdate, setLastUpdate] = useState<string>("");
//   const [apiTimestamp, setApiTimestamp] = useState<string>("");
//   const [blueSheetWarning, setBlueSheetWarning] = useState<string>("");
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string>("");

//   const intervalRef = useRef<ReturnType<typeof setInterval>>();

//   const maxMatrixValue = useMemo(() => {
//     let max = 0;
//     matrix.forEach((row) => {
//       row.values.forEach((value) => {
//         if (value > max) max = value;
//       });
//     });
//     return max;
//   }, [matrix]);

//   const redChartConfig = {
//     vulnerabilities: {
//       label: "Vulnerabilities",
//       color: "hsl(var(--red-team))",
//     },
//   } satisfies ChartConfig;

//   const blueRiskChartConfig = {
//     blueAttained: {
//       label: "Blue Attained",
//       color: "hsl(var(--blue-team) / 0.35)",
//     },
//     redFound: {
//       label: "Red Found",
//       color: "hsl(var(--red-team))",
//     },
//   } satisfies ChartConfig;

//   useEffect(() => {
//     const load = async () => {
//       try {
//         const summary = await fetchDashboardSummary();
//         setKpis(summary.kpis);
//         setRedLeaderboard(summary.redLeaderboard);
//         setBlueRisk(summary.blueRisk);
//         setMatrix(summary.matrix);
//         setMatches(summary.matches);
//         setApiTimestamp(summary.timestamp);
//         setBlueSheetWarning(summary.blueSheetWarning || "");
//         setError("");
//       } catch (e) {
//         setError(e instanceof Error ? e.message : "Failed to load live dashboard data");
//       } finally {
//         setIsLoading(false);
//         setLastUpdate(new Date().toLocaleTimeString());
//       }
//     };

//     load();
//     intervalRef.current = setInterval(load, POLL_INTERVAL);
//     return () => clearInterval(intervalRef.current);
//   }, []);

//   const matrixCellStyle = (value: number) => {
//     if (maxMatrixValue <= 0 || value <= 0) {
//       return { backgroundColor: "transparent" };
//     }
//     const alpha = Math.max(0.15, value / maxMatrixValue);
//     return { backgroundColor: `hsl(var(--red-team) / ${alpha})` };
//   };

//   const maxBlueAttained = blueRisk.length ? Math.max(...blueRisk.map((b) => b.blueAttained)) : 0;
//   const topBlueTeams = blueRisk.filter((b) => maxBlueAttained > 0 && b.blueAttained === maxBlueAttained);
//   const blueLeaderLabel = topBlueTeams.length > 1
//     ? "Top Blue Teams (Tie)"
//     : topBlueTeams.length === 1
//       ? `${topBlueTeams[0].team} Leads`
//       : "Top Blue Team";
//   const blueLeaderSubtitle = topBlueTeams.length > 1
//     ? topBlueTeams.map((b) => b.team).join(" � ")
//     : "Max Nombre de vuln�rabilit�s Atteintes";

//   return (
//     <div className="min-h-screen bg-background">
//       <header className="border-b border-border px-6 py-4">
//         <div className="max-w-7xl mx-auto flex items-center justify-between">
//           <div className="flex items-center gap-4">
//             <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
//               <img src={talanLogo} alt="Talan Tunisie" className="h-8" />
//             </button>
//             <div className="h-4 w-px bg-border" />
//             <h1 className="font-display text-sm md:text-base font-bold tracking-widest uppercase text-foreground">
//               <span className="text-blue-team">Blue</span>
//               <span className="text-muted-foreground mx-2">vs</span>
//               <span className="text-red-team">Red</span>
//               <span className="text-muted-foreground ml-2">- Jury Live Screen</span>
//             </h1>
//           </div>

//           <div className="flex items-center gap-1.5">
//             <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
//             <span className="text-xs text-muted-foreground font-body">Live - {lastUpdate}</span>
//           </div>
//         </div>
//       </header>

//       <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
//         {error && (
//           <Card className="border-destructive/40 bg-destructive/5">
//             <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
//           </Card>
//         )}

//         <motion.div
//           initial={{ opacity: 0, y: 16 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.35 }}
//           className="grid grid-cols-2 md:grid-cols-4 gap-4"
//         >
//           <Card>
//             <CardHeader className="pb-2">
//               <CardDescription>Total Found</CardDescription>
//               <CardTitle className="text-2xl font-score text-red-team">{kpis.totalFound}</CardTitle>
//             </CardHeader>
//           </Card>
//           <Card>
//             <CardHeader className="pb-2">
//               <CardDescription>Total Accepted</CardDescription>
//               <CardTitle className="text-2xl font-score text-blue-team">{kpis.totalAccepted}</CardTitle>
//             </CardHeader>
//           </Card>
//           <Card>
//             <CardHeader className="pb-2">
//               <CardDescription>Total Rejected</CardDescription>
//               <CardTitle className="text-2xl font-score text-primary">{kpis.totalRejected}</CardTitle>
//             </CardHeader>
//           </Card>
//           <Card>
//             <CardHeader className="pb-2">
//               <CardDescription>Leading Red Team</CardDescription>
//               <CardTitle className="text-2xl font-score text-red-team">{kpis.leadingRedTeam}</CardTitle>
//             </CardHeader>
//           </Card>
//         </motion.div>

//         <motion.div
//           initial={{ opacity: 0, y: 16 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.4 }}
//           className="grid grid-cols-1 xl:grid-cols-2 gap-6"
//         >
//           <Card className="border-red-team/30">
//             <CardHeader>
//               <CardTitle className="font-display text-red-team text-xl">Red Teams Leaderboard</CardTitle>
//               <CardDescription>4 hacker teams - vulnerabilities found</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <ChartContainer config={redChartConfig} className="h-72 w-full aspect-auto">
//                 <BarChart data={redLeaderboard} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
//                   <CartesianGrid vertical={false} />
//                   <XAxis dataKey="team" tickLine={false} axisLine={false} interval={0} />
//                   <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} />
//                   <ChartTooltip content={<ChartTooltipContent />} />
//                   <Bar dataKey="vulnerabilities" fill="var(--color-vulnerabilities)" radius={[6, 6, 0, 0]} />
//                 </BarChart>
//               </ChartContainer>
//             </CardContent>
//           </Card>

//           {/* <Card className="border-blue-team/30">
//             <CardHeader>
//               <CardTitle className="font-display text-blue-team text-xl">Blue Risk: Declared vs Red Found</CardTitle>
//               <CardDescription>Per app: Blue declared attained vulnerabilities vs Red discovered findings</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <ChartContainer config={blueRiskChartConfig} className="h-72 w-full aspect-auto">
//                 <BarChart data={blueRisk} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
//                   <CartesianGrid vertical={false} />
//                   <XAxis dataKey="team" tickLine={false} axisLine={false} interval={0} />
//                   <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} />
//                   <ChartTooltip content={<ChartTooltipContent />} />
//                   <Bar dataKey="blueAttained" stackId="risk" fill="var(--color-blueAttained)" radius={[6, 6, 0, 0]} />
//                   <Bar dataKey="redFound" stackId="risk" fill="var(--color-redFound)" radius={[6, 6, 0, 0]} />
//                 </BarChart>
//               </ChartContainer>
//             </CardContent>
//           </Card> */}
//         </motion.div>

//         <Card>
//           <CardHeader>
//             <CardTitle className="font-display text-lg">Red vs Blue Matrix</CardTitle>
//             <CardDescription>Rows = Red teams, Columns = Blue apps, Value = findings count</CardDescription>
//           </CardHeader>
//           <CardContent className="overflow-auto">
//             <table className="w-full text-sm border-collapse">
//               <thead>
//                 <tr>
//                   <th className="text-left p-2 border-b border-border">Team</th>
//                   {Array.from({ length: 12 }, (_, i) => (
//                     <th key={`head-${i + 1}`} className="text-center p-2 border-b border-border min-w-[56px]">
//                       B{i + 1}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {matrix.map((row) => (
//                   <tr key={row.redTeam}>
//                     <td className="p-2 border-b border-border font-display text-red-team">{row.redTeam}</td>
//                     {row.values.map((value, idx) => (
//                       <td
//                         key={`${row.redTeam}-${idx}`}
//                         className="p-2 border-b border-border text-center font-score"
//                         style={matrixCellStyle(value)}
//                       >
//                         {value}
//                       </td>
//                     ))}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </CardContent>
//         </Card>

//         {!isLoading && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ duration: 0.5 }}
//             className="grid grid-cols-1 md:grid-cols-2 gap-6"
//           >
//             {matches.map((match, i) => (
//               <MatchPanel key={match.matchId} match={match} index={i} />
//             ))}
//           </motion.div>
//         )}

//         {!isLoading && (
//           <div className="mt-2 space-y-4">
//             <FinalWinner matches={matches} />

//             <motion.div
//               initial={{ opacity: 0, y: 12 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.35, duration: 0.45 }}
//               className="rounded-xl border-2 border-blue-team/40 bg-blue-team/5 p-6 text-center"
//             >
//               <h2 className="font-display text-2xl md:text-3xl font-black tracking-wider uppercase text-blue-team">
//                 {blueLeaderLabel}
//               </h2>
//               <p className="font-body text-sm text-muted-foreground mt-1">{blueLeaderSubtitle}</p>

//               <div className="mt-4 text-center">
//                 <p className="text-xs font-display tracking-wider uppercase text-blue-team">Blue Atteintes</p>
//                 <p className="font-score text-3xl md:text-4xl font-black text-blue-team">{maxBlueAttained}</p>
//               </div>
//             </motion.div>
//           </div>
//         )}

//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ delay: 0.4 }}
//           className="text-center"
//         >
//           <p className="text-xs text-muted-foreground font-body">
//             Auto-refreshes every 5 seconds - Data source: Red + Blue Google Sheets
//           </p>
//         </motion.div>
//       </main>
//     </div>
//   );
// };

// export default Dashboard;

//1
// import { useEffect, useMemo, useRef, useState } from "react";
// import { motion } from "framer-motion";
// import { useNavigate } from "react-router-dom";
// import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
// import MatchPanel from "@/components/MatchPanel";
// import FinalWinner from "@/components/FinalWinner";
// import {
//   fetchDashboardSummary,
//   type MatchData,
//   type KpiSummary,
//   type MatrixRow,
//   type RedLeaderboardItem,
//   type BlueRiskItem,
// } from "@/services/api";
// import talanLogo from "@/assets/talan-logo.jpg";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

// const POLL_INTERVAL = 5000;

// const initialKpis: KpiSummary = {
//   totalFound: 0,
//   totalAccepted: 0,
//   totalRejected: 0,
//   totalBlueAttained: 0,
//   totalBlueNonAttained: 0,
//   totalRedFound: 0,
//   totalNewFindings: 0,
//   avgCoveragePct: 0,
//   leadingRedTeam: "-",
//   leadingRedAccepted: 0,
//   mostTargetedBlueTeam: "-",
//   mostTargetedBlueCount: 0,
// };

// const Dashboard = () => {
//   const navigate = useNavigate();

//   const [matches, setMatches] = useState<MatchData[]>([]);
//   const [kpis, setKpis] = useState<KpiSummary>(initialKpis);
//   const [redLeaderboard, setRedLeaderboard] = useState<RedLeaderboardItem[]>([]);
//   const [blueRisk, setBlueRisk] = useState<BlueRiskItem[]>([]);
//   const [matrix, setMatrix] = useState<MatrixRow[]>([]);

//   const [lastUpdate, setLastUpdate] = useState<string>("");
//   const [apiTimestamp, setApiTimestamp] = useState<string>("");
//   const [blueSheetWarning, setBlueSheetWarning] = useState<string>("");
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string>("");

//   const intervalRef = useRef<ReturnType<typeof setInterval>>();

//   const maxMatrixValue = useMemo(() => {
//     let max = 0;
//     matrix.forEach((row) => {
//       row.values.forEach((value) => {
//         if (value > max) max = value;
//       });
//     });
//     return max;
//   }, [matrix]);

//   const redChartConfig = {
//     vulnerabilities: {
//       label: "Vulnerabilities",
//       color: "hsl(var(--red-team))",
//     },
//   } satisfies ChartConfig;

//   const blueRiskChartConfig = {
//     blueAttained: {
//       label: "Blue Attained",
//       color: "hsl(var(--blue-team) / 0.35)",
//     },
//     redFound: {
//       label: "Red Found",
//       color: "hsl(var(--red-team))",
//     },
//   } satisfies ChartConfig;

//   useEffect(() => {
//     const load = async () => {
//       try {
//         const summary = await fetchDashboardSummary();
//         setKpis(summary.kpis);
//         setRedLeaderboard(summary.redLeaderboard);
//         setBlueRisk(summary.blueRisk);
//         setMatrix(summary.matrix);
//         setMatches(summary.matches);
//         setApiTimestamp(summary.timestamp);
//         setBlueSheetWarning(summary.blueSheetWarning || "");
//         setError("");
//       } catch (e) {
//         setError(e instanceof Error ? e.message : "Failed to load live dashboard data");
//       } finally {
//         setIsLoading(false);
//         setLastUpdate(new Date().toLocaleTimeString());
//       }
//     };

//     load();
//     intervalRef.current = setInterval(load, POLL_INTERVAL);
//     return () => clearInterval(intervalRef.current);
//   }, []);

//   const matrixCellStyle = (value: number) => {
//     if (maxMatrixValue <= 0 || value <= 0) {
//       return { backgroundColor: "transparent" };
//     }
//     const alpha = Math.max(0.15, value / maxMatrixValue);
//     return { backgroundColor: `hsl(var(--red-team) / ${alpha})` };
//   };

//   // --- TOP BLUE TEAMS (existing logic kept) ---
//   const maxBlueAttained = blueRisk.length ? Math.max(...blueRisk.map((b) => b.blueAttained)) : 0;
//   const topBlueTeams = blueRisk.filter((b) => maxBlueAttained > 0 && b.blueAttained === maxBlueAttained);
//   const blueLeaderLabel =
//     topBlueTeams.length > 1
//       ? "Top Blue Teams (Tie)"
//       : topBlueTeams.length === 1
//         ? `${topBlueTeams[0].team} Leads`
//         : "Top Blue Team";
//   const blueLeaderSubtitle =
//     topBlueTeams.length > 1 ? topBlueTeams.map((b) => b.team).join(" • ") : "Max Nombre de vulnérabilités Atteintes";

//   // --- TOP HACKERS (NEW) ---
//   const maxRedVulns = redLeaderboard.length ? Math.max(...redLeaderboard.map((r) => r.vulnerabilities)) : 0;
//   const topHackers = redLeaderboard.filter((r) => maxRedVulns > 0 && r.vulnerabilities === maxRedVulns);

//   const topHackersLabel =
//     topHackers.length > 1
//       ? "Top Hackers (Tie)"
//       : topHackers.length === 1
//         ? `${topHackers[0].team} Leads`
//         : "Top Hackers";

//   const topHackersSubtitle = topHackers.length > 1 ? topHackers.map((t) => t.team).join(" • ") : "Max vulnerabilities found";

//   return (
//     <div className="min-h-screen bg-background">
//       <header className="border-b border-border px-6 py-4">
//         <div className="max-w-7xl mx-auto flex items-center justify-between">
//           <div className="flex items-center gap-4">
//             <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
//               <img src={talanLogo} alt="Talan Tunisie" className="h-8" />
//             </button>
//             <div className="h-4 w-px bg-border" />
//             <h1 className="font-display text-sm md:text-base font-bold tracking-widest uppercase text-foreground">
//               <span className="text-blue-team">Blue</span>
//               <span className="text-muted-foreground mx-2">vs</span>
//               <span className="text-red-team">Red</span>
//               <span className="text-muted-foreground ml-2">- Jury Live Screen</span>
//             </h1>
//           </div>

//           <div className="flex items-center gap-1.5">
//             <span className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
//             <span className="text-xs text-muted-foreground font-body">Live - {lastUpdate}</span>
//           </div>
//         </div>
//       </header>

//       <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
//         {error && (
//           <Card className="border-destructive/40 bg-destructive/5">
//             <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
//           </Card>
//         )}

//         <motion.div
//           initial={{ opacity: 0, y: 16 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.35 }}
//           className="grid grid-cols-2 md:grid-cols-4 gap-4"
//         >
//           <Card>
//             <CardHeader className="pb-2">
//               <CardDescription>Total Found</CardDescription>
//               <CardTitle className="text-2xl font-score text-red-team">{kpis.totalFound}</CardTitle>
//             </CardHeader>
//           </Card>
//           <Card>
//             <CardHeader className="pb-2">
//               <CardDescription>Total Accepted</CardDescription>
//               <CardTitle className="text-2xl font-score text-blue-team">{kpis.totalAccepted}</CardTitle>
//             </CardHeader>
//           </Card>
//           <Card>
//             <CardHeader className="pb-2">
//               <CardDescription>Total Rejected</CardDescription>
//               <CardTitle className="text-2xl font-score text-primary">{kpis.totalRejected}</CardTitle>
//             </CardHeader>
//           </Card>
//           <Card>
//             <CardHeader className="pb-2">
//               <CardDescription>Leading Red Team</CardDescription>
//               <CardTitle className="text-2xl font-score text-red-team">{kpis.leadingRedTeam}</CardTitle>
//             </CardHeader>
//           </Card>
//         </motion.div>

//         {/* Leaderboard + Side cards */}
//         <motion.div
//           initial={{ opacity: 0, y: 16 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.4 }}
//           className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6"
//         >
//           {/* LEFT: Leaderboard */}
//           <Card className="border-red-team/30">
//             <CardHeader>
//               <CardTitle className="font-display text-red-team text-xl">Red Teams Leaderboard</CardTitle>
//               <CardDescription>4 hacker teams - vulnerabilities found</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <ChartContainer config={redChartConfig} className="h-72 w-full aspect-auto">
//                 <BarChart data={redLeaderboard} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
//                   <CartesianGrid vertical={false} />
//                   <XAxis dataKey="team" tickLine={false} axisLine={false} interval={0} />
//                   <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} />
//                   <ChartTooltip content={<ChartTooltipContent />} />
//                   <Bar dataKey="vulnerabilities" fill="var(--color-vulnerabilities)" radius={[6, 6, 0, 0]} />
//                 </BarChart>
//               </ChartContainer>
//             </CardContent>
//           </Card>

//           {/* RIGHT: Top Hackers + Top Blue Teams */}
//           <div className="grid gap-6">
//             <Card className="border-red-team/30">
//               <CardHeader className="pb-2">
//                 <CardTitle className="font-display text-red-team">Top Hackers</CardTitle>
//                 <CardDescription>{topHackersLabel}</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="flex items-end justify-between gap-3">
//                   <div>
//                     <p className="text-sm text-muted-foreground">{topHackersSubtitle}</p>
//                     <p className="mt-2 font-score text-4xl font-black text-red-team">{maxRedVulns}</p>
//                   </div>

//                   <div className="text-right">
//                     <p className="text-xs font-display tracking-wider uppercase text-muted-foreground">Teams</p>
//                     <p className="font-display text-sm">{topHackers.length ? topHackers.map((t) => t.team).join(" • ") : "-"}</p>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="border-blue-team/30">
//               <CardHeader className="pb-2">
//                 <CardTitle className="font-display text-blue-team">Top Blue Teams </CardTitle>
//                 <CardDescription>{blueLeaderLabel}</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="flex items-end justify-between gap-3">
//                   <div>
//                     <p className="text-sm text-muted-foreground">{blueLeaderSubtitle}</p>
//                     <p className="mt-2 font-score text-4xl font-black text-blue-team">{maxBlueAttained}</p>
//                   </div>

//                   <div className="text-right">
//                     <p className="text-xs font-display tracking-wider uppercase text-muted-foreground">Teams</p>
//                     <p className="font-display text-sm">{topBlueTeams.length ? topBlueTeams.map((b) => b.team).join(" • ") : "-"}</p>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </motion.div>

//         <Card>
//           <CardHeader>
//             <CardTitle className="font-display text-lg">Red vs Blue Matrix</CardTitle>
//             <CardDescription>Rows = Red teams, Columns = Blue apps, Value = findings count</CardDescription>
//           </CardHeader>
//           <CardContent className="overflow-auto">
//             <table className="w-full text-sm border-collapse">
//               <thead>
//                 <tr>
//                   <th className="text-left p-2 border-b border-border">Team</th>
//                   {Array.from({ length: 12 }, (_, i) => (
//                     <th key={`head-${i + 1}`} className="text-center p-2 border-b border-border min-w-[56px]">
//                       B{i + 1}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {matrix.map((row) => (
//                   <tr key={row.redTeam}>
//                     <td className="p-2 border-b border-border font-display text-red-team">{row.redTeam}</td>
//                     {row.values.map((value, idx) => (
//                       <td
//                         key={`${row.redTeam}-${idx}`}
//                         className="p-2 border-b border-border text-center font-score"
//                         style={matrixCellStyle(value)}
//                       >
//                         {value}
//                       </td>
//                     ))}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </CardContent>
//         </Card>

//         {!isLoading && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ duration: 0.5 }}
//             className="grid grid-cols-1 md:grid-cols-2 gap-6"
//           >
//             {matches.map((match, i) => (
//               <MatchPanel key={match.matchId} match={match} index={i} />
//             ))}
//           </motion.div>
//         )}

//         {!isLoading && (
//           <div className="mt-2 space-y-4">
//             <FinalWinner matches={matches} />

//             <motion.div
//               initial={{ opacity: 0, y: 12 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.35, duration: 0.45 }}
//               className="rounded-xl border-2 border-blue-team/40 bg-blue-team/5 p-6 text-center"
//             >
//               <h2 className="font-display text-2xl md:text-3xl font-black tracking-wider uppercase text-blue-team">
//                 {blueLeaderLabel}
//               </h2>
//               <p className="font-body text-sm text-muted-foreground mt-1">{blueLeaderSubtitle}</p>

//               <div className="mt-4 text-center">
//                 <p className="text-xs font-display tracking-wider uppercase text-blue-team">Blue Atteintes</p>
//                 <p className="font-score text-3xl md:text-4xl font-black text-blue-team">{maxBlueAttained}</p>
//               </div>
//             </motion.div>
//           </div>
//         )}

//         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center">
//           <p className="text-xs text-muted-foreground font-body">
//             Auto-refreshes every 5 seconds - Data source: Red + Blue Google Sheets
//           </p>
//         </motion.div>
//       </main>
//     </div>
//   );
// };

// export default Dashboard;

//2

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import MatchPanel from "@/components/MatchPanel";
import FinalWinner from "@/components/FinalWinner";
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

const POLL_INTERVAL = 5000;

const initialKpis: KpiSummary = {
  totalFound: 0,
  totalAccepted: 0,
  totalRejected: 0,
  totalBlueAttained: 0,
  totalBlueNonAttained: 0,
  totalRedFound: 0,
  totalNewFindings: 0,
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
  const [apiTimestamp, setApiTimestamp] = useState<string>("");
  const [blueSheetWarning, setBlueSheetWarning] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

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

  const blueRiskChartConfig = {
    blueAttained: {
      label: "Blue Attained",
      color: "hsl(var(--blue-team) / 0.35)",
    },
    redFound: {
      label: "Red Found",
      color: "hsl(var(--red-team))",
    },
  } satisfies ChartConfig;

  useEffect(() => {
    const load = async () => {
      try {
        const summary = await fetchDashboardSummary();
        setKpis(summary.kpis);
        setRedLeaderboard(summary.redLeaderboard);
        setBlueRisk(summary.blueRisk);
        setMatrix(summary.matrix);
        setMatches(summary.matches);
        setApiTimestamp(summary.timestamp);
        setBlueSheetWarning(summary.blueSheetWarning || "");
        setError("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load live dashboard data");
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

  const maxBlueAttained = blueRisk.length ? Math.max(...blueRisk.map((b) => b.blueAttained)) : 0;
  const topBlueTeams = blueRisk.filter((b) => maxBlueAttained > 0 && b.blueAttained === maxBlueAttained);

  const blueLeaderLabel =
    topBlueTeams.length > 1
      ? "Top Blue Teams (Tie)"
      : topBlueTeams.length === 1
      ? `${topBlueTeams[0].team} Leads`
      : "Top Blue Team";

  const blueLeaderSubtitle =
    topBlueTeams.length > 1 ? topBlueTeams.map((b) => b.team).join(" • ") : "Max Nombre de vulnérabilités Atteintes";

  const maxRedVulns = redLeaderboard.length ? Math.max(...redLeaderboard.map((r) => r.vulnerabilities)) : 0;
  const topHackers = redLeaderboard.filter((r) => maxRedVulns > 0 && r.vulnerabilities === maxRedVulns);

  const topHackersLabel =
    topHackers.length > 1
      ? "Top Hackers (Tie)"
      : topHackers.length === 1
      ? `${topHackers[0].team} Leads`
      : "Top Hackers";

  const topHackersSubtitle =
    topHackers.length > 1 ? topHackers.map((t) => t.team).join(" • ") : "Max vulnerabilities found";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
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

        {/* Leaderboard + Right Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6"
        >
          <Card className="border-red-team/30">
            <CardHeader>
              <CardTitle className="font-display text-red-team text-xl">
                Red Teams Leaderboard
              </CardTitle>
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
                <p className="text-4xl font-black text-red-team">{maxRedVulns}</p>
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

        {/* MATCH SCREENS */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.map((match, i) => (
              <MatchPanel key={match.matchId} match={match} index={i} />
            ))}
          </div>
        )}

        {/* FINAL WINNER ONLY */}
        {/* {!isLoading && (
          <div className="mt-4">
            <FinalWinner matches={matches} />
          </div>
        )} */}

      </main>
    </div>
  );
};

export default Dashboard;
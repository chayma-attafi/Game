import { motion } from "framer-motion";
import type { MatchData } from "@/services/api";
import { getWinner } from "@/services/api";
import ScoreBar from "./ScoreBar";

interface MatchPanelProps {
  match: MatchData;
  index: number;
}

const MatchPanel = ({ match, index }: MatchPanelProps) => {
  const winner = getWinner(match);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="battle-card rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div className="battle-gradient px-6 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-bold tracking-widest uppercase text-foreground">
            {match.matchName}
          </h2>
          <WinnerBadge winner={winner} />
        </div>
      </div>

      {/* Scores */}
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          {/* Blue Team */}
          <div className="text-center flex-1">
            <p className="text-xs font-display tracking-wider uppercase text-blue-team mb-1">
              {match.blueTeam}
            </p>
            <motion.p
              key={match.blueScore}
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              className="font-score text-5xl font-black text-blue-team text-glow-blue"
            >
              {match.blueScore}
            </motion.p>
          </div>

          {/* VS */}
          <div className="px-4">
            <span className="font-display text-lg font-bold text-muted-foreground">VS</span>
          </div>

          {/* Red Team */}
          <div className="text-center flex-1">
            <p className="text-xs font-display tracking-wider uppercase text-red-team mb-1">
              {match.redTeam}
            </p>
            <motion.p
              key={match.redScore}
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              className="font-score text-5xl font-black text-red-team text-glow-red"
            >
              {match.redScore}
            </motion.p>
          </div>
        </div>

        {/* Score Bars */}
        <ScoreBar blueScore={match.blueScore} redScore={match.redScore} />

        {/* Stats */}
        <div className="mt-4 flex justify-between text-xs text-muted-foreground font-body">
          <span>Vulns reported: {match.totalVulnerabilities}</span>
          <span>Found by Red: {match.acceptedVulnerabilities}</span>
        </div>
      </div>
    </motion.div>
  );
};

function WinnerBadge({ winner }: { winner: "blue" | "red" | "tie" }) {
  const config = {
    blue: { label: "🛡️ Blue Leads", className: "bg-blue-team/20 text-blue-team border-blue-team/30" },
    red: { label: "⚔️ Red Leads", className: "bg-red-team/20 text-red-team border-red-team/30" },
    tie: { label: "⚖️ Tied", className: "bg-muted text-muted-foreground border-border" },
  };

  const { label, className } = config[winner];

  return (
    <motion.span
      key={winner}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-display font-semibold border ${className}`}
    >
      {label}
    </motion.span>
  );
}

export default MatchPanel;


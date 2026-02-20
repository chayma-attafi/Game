import { motion } from "framer-motion";
import type { MatchData } from "@/services/api";

interface FinalWinnerProps {
  matches: MatchData[];
}

const FinalWinner = ({ matches }: FinalWinnerProps) => {
  if (matches.length === 0) return null;

  const maxScore = Math.max(...matches.map((m) => m.redScore));
  const winningHackers = matches.filter((m) => m.redScore === maxScore);
  const isTie = winningHackers.length > 1;

  const label = isTie ? "Top Hackers (Tie)" : `${winningHackers[0].redTeam} Wins`;
  const subtitle = isTie
    ? winningHackers.map((m) => m.redTeam).join(" • ")
    : "Best score (found - rejected)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="rounded-xl border-2 border-red-team/40 bg-red-team/5 p-6 text-center"
    >
      <motion.h2
        key={label}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="font-display text-2xl md:text-3xl font-black tracking-wider uppercase text-red-team"
      >
        {label}
      </motion.h2>
      <p className="font-body text-sm text-muted-foreground mt-1">{subtitle}</p>

      <div className="mt-4 text-center">
        <p className="text-xs font-display tracking-wider uppercase text-red-team">Red Score</p>
        <motion.p
          key={maxScore}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className="font-score text-3xl md:text-4xl font-black text-red-team"
        >
          {maxScore}
        </motion.p>
      </div>
    </motion.div>
  );
};

export default FinalWinner;




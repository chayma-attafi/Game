import { motion } from "framer-motion";

interface ScoreBarProps {
  blueScore: number;
  redScore: number;
}

const ScoreBar = ({ blueScore, redScore }: ScoreBarProps) => {
  const total = blueScore + redScore || 1;
  const bluePercent = (blueScore / total) * 100;
  const redPercent = (redScore / total) * 100;

  return (
    <div className="space-y-2">
      {/* Combined comparison bar */}
      <div className="relative h-3 rounded-full overflow-hidden bg-secondary">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-l-full"
          style={{ backgroundColor: "hsl(var(--blue-team))" }}
          initial={{ width: 0 }}
          animate={{ width: `${bluePercent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <motion.div
          className="absolute right-0 top-0 h-full rounded-r-full"
          style={{ backgroundColor: "hsl(var(--red-team))" }}
          initial={{ width: 0 }}
          animate={{ width: `${redPercent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {/* Percentage labels */}
      <div className="flex justify-between text-xs font-display">
        <span className="text-blue-team">{bluePercent.toFixed(0)}%</span>
        <span className="text-red-team">{redPercent.toFixed(0)}%</span>
      </div>
    </div>
  );
};

export default ScoreBar;

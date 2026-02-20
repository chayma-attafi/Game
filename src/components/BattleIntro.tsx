import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface BattleIntroProps {
  onComplete: () => void;
}

const BattleIntro = ({ onComplete }: BattleIntroProps) => {
  const [phase, setPhase] = useState<"clash" | "flash" | "done">("clash");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("flash"), 2000);
    const t2 = setTimeout(() => setPhase("done"), 3000);
    const t3 = setTimeout(onComplete, 3500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background"
      animate={phase === "done" ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background energy lines */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/2 left-0 w-1/2 h-0.5 origin-right"
          style={{ backgroundColor: "hsl(var(--blue-team))" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <motion.div
          className="absolute top-1/2 right-0 w-1/2 h-0.5 origin-left"
          style={{ backgroundColor: "hsl(var(--red-team))" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      <div className="relative flex items-center gap-8">
        {/* Blue side */}
        <motion.div
          initial={{ x: -200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-right"
        >
          <p className="font-display text-sm tracking-widest uppercase text-blue-team mb-1">Developers</p>
          <p className="font-display text-6xl md:text-8xl font-black text-blue-team text-glow-blue">🛡️</p>
        </motion.div>

        {/* VS center clash */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={phase === "flash"
            ? { scale: [1, 1.5, 1], rotate: 0 }
            : { scale: 1, rotate: 0 }
          }
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative"
        >
          <span className="font-display text-4xl md:text-6xl font-black text-foreground">⚔️</span>
          {phase === "flash" && (
            <motion.div
              className="absolute inset-0 rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.4 }}
              style={{
                boxShadow: "0 0 60px 30px hsl(var(--primary) / 0.6)",
              }}
            />
          )}
        </motion.div>

        {/* Red side */}
        <motion.div
          initial={{ x: 200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-left"
        >
          <p className="font-display text-sm tracking-widest uppercase text-red-team mb-1">Hackers</p>
          <p className="font-display text-6xl md:text-8xl font-black text-red-team text-glow-red">💀</p>
        </motion.div>
      </div>

      {/* Battle text */}
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-1/4 font-display text-xl md:text-2xl tracking-[0.3em] uppercase text-primary text-glow-primary"
      >
        Battle Begins
      </motion.p>
    </motion.div>
  );
};

export default BattleIntro;

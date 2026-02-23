import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import BattleIntro from "@/components/BattleIntro";
import talanLogo from "@/assets/talan-logo.jpg";
import { playStartBattleAudio } from "@/lib/sfx";

const Index = () => {
  const navigate = useNavigate();
  const [showIntro, setShowIntro] = useState(false);

  const handleStart = async () => {
    await playStartBattleAudio();
    setShowIntro(true);
  };

  const handleIntroComplete = useCallback(() => {
    navigate("/dashboard");
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background overflow-hidden">
      {showIntro && <BattleIntro onComplete={handleIntroComplete} />}

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, hsl(var(--primary) / 0.06) 0%, transparent 70%)`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center px-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-8"
        >
          <img src={talanLogo} alt="Talan Tunisie" className="h-24 md:h-32 mx-auto" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-2"
        >
          <span className="font-display text-xs tracking-[0.5em] uppercase text-primary">
            Talan Tunisie presents
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="font-display text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight"
        >
          <span className="text-blue-team text-glow-blue">BLUE</span>
          <span className="text-muted-foreground mx-4 text-3xl md:text-5xl">vs</span>
          <span className="text-red-team text-glow-red">RED</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="font-body text-lg md:text-xl text-muted-foreground mb-12 max-w-md mx-auto"
        >
          Developers defend. Hackers attack. Only one team prevails.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleStart}
          disabled={showIntro}
          className="relative font-display text-lg md:text-xl font-bold tracking-widest uppercase px-12 py-4 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{
            boxShadow: "0 0 20px hsl(var(--primary) / 0.2), 0 0 40px hsl(var(--primary) / 0.08)",
          }}
        >
          Start Battle
        </motion.button>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-16 flex items-center justify-center gap-8 text-sm md:text-base uppercase tracking-wider text-muted-foreground"
        >
          <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
            Blue Defense
          </motion.span>
          <motion.span animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 1 }}>
            Red Attack
          </motion.span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Index;


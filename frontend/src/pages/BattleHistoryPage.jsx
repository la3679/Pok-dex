import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useProfile } from "../context/ProfileContext";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/States";

export default function BattleHistoryPage() {
  const { battleHistory, clearBattleHistory } = useProfile();

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring", bounce: 0.3 } },
  };

  return (
    <div className="pokedex-screen battle-history-page">
      <div className="boot-screen__scanlines" />
      <PageHeader
        eyebrow="Combat Logs"
        title="Battle History"
        description="Local records of completed simulations. All tactical data is stored on this device."
        actions={
          battleHistory.length ? (
            <button
              className="button button--quiet"
              onClick={clearBattleHistory}
            >
              Purge Logs
            </button>
          ) : null
        }
      />

      {battleHistory.length ? (
        <motion.div
          className="history-list terminal-panel"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {battleHistory.map((entry) => (
            <motion.article key={entry.id} variants={item} className="terminal-panel">
              <div
                className={`history-result history-result--${entry.result.toLowerCase()}`}
              >
                {entry.result === "User"
                  ? "WIN"
                  : entry.result === "CPU"
                    ? "LOSS"
                    : "DRAW"}
              </div>
              <div>
                <strong className="sys-prompt">{new Date(entry.playedAt).toLocaleString()}</strong>
                <p className="terminal-text">{entry.team.map((member) => member.name).join(" · ")}</p>
                <small className="terminal-text">
                  <span className="sys-prompt">&gt;</span>
                  {entry.log?.slice(-2).join(" ")}
                </small>
              </div>
            </motion.article>
          ))}
        </motion.div>
      ) : (
        <EmptyState title="No simulations completed">
          Commence field testing to record battle metrics.
          <Link className="button button--primary" to="/battle">
            Initialize Simulator
          </Link>
        </EmptyState>
      )}
    </div>
  );
}

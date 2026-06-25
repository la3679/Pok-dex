import { Link } from "react-router-dom";
import { useProfile } from "../context/ProfileContext";
import { PageHeader } from "../components/ui/PageHeader";

export default function AchievementsPage() {
  const { achievements } = useProfile();
  return (
    <div className="pokedex-screen achievements-page">
      <div className="boot-screen__scanlines" />
      <PageHeader
        eyebrow="Local progression"
        title="Achievements"
        description="Milestones are calculated privately from this browser’s favorites, discoveries, map use, comparisons, teams, and battle record."
        actions={
          <Link className="button button--quiet" to="/profile">
            Open profile
          </Link>
        }
      />
      <section className="achievement-summary terminal-panel">
        <div>
          <strong className="sys-prompt">{achievements.unlocked}</strong>
          <span className="terminal-text">
            of {achievements.total} unlocked
          </span>
        </div>
        <i>
          <b
            style={{
              width: `${(achievements.unlocked / achievements.total) * 100}%`,
            }}
          />
        </i>
      </section>
      <section className="achievement-grid">
        {achievements.achievements.map((achievement) => (
          <article
            className={`terminal-panel ${achievement.unlocked ? "is-unlocked" : ""}`}
            key={achievement.id}
          >
            <span aria-hidden="true" className="sys-prompt">
              {achievement.icon}
            </span>
            <div>
              <small className="terminal-text">
                {achievement.unlocked
                  ? "Unlocked"
                  : `${achievement.value}/${achievement.target}`}
              </small>
              <h2 className="sys-prompt">{achievement.title}</h2>
              <p className="terminal-text">{achievement.description}</p>
              <i>
                <b style={{ width: `${achievement.progress}%` }} />
              </i>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

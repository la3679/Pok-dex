import { Link } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { PageHeader } from '../components/ui/PageHeader';

export default function AchievementsPage() {
  const { achievements } = useProfile();
  return <div className="achievements-page"><PageHeader eyebrow="Local progression" title="Achievements" description="Milestones are calculated privately from this browser’s favorites, discoveries, map use, comparisons, teams, and battle record." actions={<Link className="button button--quiet" to="/profile">Open profile</Link>} />
    <section className="achievement-summary"><div><strong>{achievements.unlocked}</strong><span>of {achievements.total} unlocked</span></div><i><b style={{ width: `${(achievements.unlocked / achievements.total) * 100}%` }} /></i></section>
    <section className="achievement-grid">{achievements.achievements.map((achievement) => <article className={achievement.unlocked ? 'is-unlocked' : ''} key={achievement.id}><span aria-hidden="true">{achievement.icon}</span><div><small>{achievement.unlocked ? 'Unlocked' : `${achievement.value}/${achievement.target}`}</small><h2>{achievement.title}</h2><p>{achievement.description}</p><i><b style={{ width: `${achievement.progress}%` }} /></i></div></article>)}</section>
  </div>;
}

import { Link } from 'react-router-dom';
import { useProfile } from '../context/ProfileContext';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/States';

export default function BattleHistoryPage() {
  const { battleHistory, clearBattleHistory } = useProfile();
  return <div className="battle-history-page"><PageHeader eyebrow="Battle simulator" title="Battle history" description="Completed battles are saved locally on this device. Review your result, roster, and final battle events." actions={battleHistory.length ? <button className="button button--quiet" onClick={clearBattleHistory}>Clear history</button> : null} />{battleHistory.length ? <div className="history-list">{battleHistory.map((entry) => <article key={entry.id}><div className={`history-result history-result--${entry.result.toLowerCase()}`}>{entry.result === 'User' ? 'WIN' : entry.result === 'CPU' ? 'LOSS' : 'DRAW'}</div><div><strong>{new Date(entry.playedAt).toLocaleString()}</strong><p>{entry.team.map((member) => member.name).join(' · ')}</p><small>{entry.log?.slice(-2).join(' ')}</small></div></article>)}</div> : <EmptyState title="No completed battles yet">Start a squad battle to build a local battle history.<Link className="button button--primary" to="/battle">Open Battle Arena</Link></EmptyState>}</div>;
}

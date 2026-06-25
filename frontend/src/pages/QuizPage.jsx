import axios from "axios";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import apiBaseUrl from "../api";
import { PageHeader } from "../components/ui/PageHeader";
import { ErrorBanner, PokeballLoader } from "../components/ui/States";
import { TypeBadge } from "../components/ui/TypeBadge";
import { quizQuestion } from "../lib/phase10";

const modes = [
  ["silhouette", "Silhouette"],
  ["type", "Type match"],
  ["higher-stat", "Higher stat"],
  ["stats", "Stat signature"],
];
const label = (value) => value.replace("_", " ");

export default function QuizPage() {
  const [mode, setMode] = useState("silhouette");
  const [question, setQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0, streak: 0 });
  const [poolPage, setPoolPage] = useState(
    () => Math.floor(Math.random() * 13) + 1,
  );
  const pool = useQuery({
    queryKey: ["quiz-pool", poolPage],
    queryFn: async () =>
      (
        await axios.get(`${apiBaseUrl}/pokemon`, {
          params: { page: poolPage, perPage: 100, sortOption: "No." },
        })
      ).data.pokemon,
  });
  const next = (nextMode = mode) => {
    const generated = quizQuestion(nextMode, pool.data || []);
    setQuestion(generated);
    setFeedback(null);
  };
  useEffect(() => {
    if (pool.data?.length) next(mode);
  }, [pool.data, mode]);
  const answer = (choice) => {
    if (!question || feedback) return;
    const value = typeof choice === "string" ? choice : choice._id;
    const correct = value === question.answer;
    setFeedback(
      correct
        ? "Correct!"
        : `Not quite — ${question.target.pokemon.name} was the answer.`,
    );
    setScore((current) => ({
      correct: current.correct + (correct ? 1 : 0),
      total: current.total + 1,
      streak: correct ? current.streak + 1 : 0,
    }));
  };
  if (pool.isLoading)
    return <PokeballLoader label="Shuffling the quiz deck…" />;
  if (pool.isError)
    return (
      <ErrorBanner
        title="Quiz deck unavailable"
        message="Check that the local API is running, then try again."
        onRetry={pool.refetch}
      />
    );
  if (!question)
    return (
      <ErrorBanner
        title="No quiz question available"
        message="Load another catalog sample to continue."
        onRetry={() => setPoolPage((page) => (page % 14) + 1)}
      />
    );
  const stats = question.stats || [];
  return (
    <div className="pokedex-screen quiz-page">
      <div className="boot-screen__scanlines" />
      <PageHeader
        eyebrow="Field quiz"
        title="Test your Pokédex knowledge"
        description="Questions use the catalog currently loaded from your local database. Scores stay in this tab, so you can play freely."
      />
      <section className="quiz-toolbar terminal-panel">
        <div>
          {modes.map(([value, text]) => (
            <button
              className={mode === value ? "is-active" : ""}
              key={value}
              onClick={() => {
                setMode(value);
                setFeedback(null);
              }}
            >
              {text}
            </button>
          ))}
        </div>
        <dl>
          <div>
            <dt>Correct</dt>
            <dd>
              {score.correct}/{score.total}
            </dd>
          </div>
          <div>
            <dt>Streak</dt>
            <dd>{score.streak}</dd>
          </div>
        </dl>
      </section>
      <section className="quiz-card terminal-panel">
        <p className="eyebrow">
          {modes.find(([value]) => value === question.mode)?.[1]}
        </p>
        <h2 className="sys-prompt">{question.prompt}</h2>
        {question.mode === "silhouette" && question.target.image_url && (
          <img
            className="quiz-silhouette"
            src={question.target.image_url}
            alt="Silhouetted Pokémon"
          />
        )}
        {question.mode === "type" && (
          <div className="quiz-pokemon">
            {question.target.image_url && (
              <img src={question.target.image_url} alt="" />
            )}
            <strong className="sys-prompt">
              {question.target.pokemon.name}
            </strong>
          </div>
        )}
        {question.mode === "higher-stat" && (
          <div className="quiz-duel">
            <article className="terminal-panel">
              {question.target.image_url && (
                <img src={question.target.image_url} alt="" />
              )}
              <strong className="sys-prompt">
                {question.target.pokemon.name}
              </strong>
            </article>
            <span className="sys-prompt">VS</span>
            <article className="terminal-panel">
              {question.challenger.image_url && (
                <img src={question.challenger.image_url} alt="" />
              )}
              <strong className="sys-prompt">
                {question.challenger.pokemon.name}
              </strong>
            </article>
          </div>
        )}
        {question.mode === "stats" && (
          <dl className="quiz-stats">
            {stats.map(([stat, value]) => (
              <div key={stat}>
                <dt>{label(stat)}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className={`quiz-options quiz-options--${question.mode}`}>
          {question.options.map((option) =>
            question.mode === "type" ? (
              <button
                key={option}
                onClick={() => answer(option)}
                disabled={Boolean(feedback)}
              >
                <TypeBadge type={option} />
              </button>
            ) : (
              <button
                key={option._id}
                onClick={() => answer(option)}
                disabled={Boolean(feedback)}
              >
                {option.pokemon.name}
              </button>
            ),
          )}
        </div>
        {feedback && (
          <div
            className={`quiz-feedback terminal-panel ${feedback === "Correct!" ? "is-correct" : ""}`}
            role="status"
          >
            <strong className="sys-prompt">{feedback}</strong>
            <button className="button button--primary" onClick={() => next()}>
              Next question
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

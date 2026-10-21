import { Bot, Check, MessageCircle, UserRound } from "lucide-react";
import type { Example } from "../../domain/schema";
import { categoryLabel } from "../../domain/taxonomy";

interface ConversationCardProps {
  example: Example;
  position: number;
  total: number;
}

function Turn({
  kind,
  speaker,
  text,
  number,
}: {
  kind: "user" | "model" | "pushback" | "final";
  speaker: string;
  text: string;
  number: string;
}) {
  const Icon = kind === "user" || kind === "pushback" ? UserRound : Bot;
  return (
    <article className={`conversation-turn conversation-turn--${kind}`}>
      <div className="conversation-turn__rail">
        <span className="conversation-turn__number">{number}</span>
        <span className="conversation-turn__avatar">
          <Icon size={15} aria-hidden="true" />
        </span>
      </div>
      <div className="conversation-turn__body">
        <div className="conversation-turn__header">
          <strong>{speaker}</strong>
          {kind === "pushback" ? (
            <span className="turn-tag turn-tag--pushback">
              <MessageCircle size={11} aria-hidden="true" /> PUSHBACK
            </span>
          ) : null}
          {kind === "final" ? (
            <span className="turn-tag turn-tag--final">
              <Check size={11} aria-hidden="true" /> FINAL
            </span>
          ) : null}
        </div>
        <p>{text}</p>
      </div>
    </article>
  );
}

export function ConversationCard({ example, position, total }: ConversationCardProps) {
  return (
    <section className="conversation-card" aria-label="Three-turn model conversation">
      <div className="conversation-card__header">
        <div className="conversation-card__meta">
          <span className="conversation-card__id">{example.id}</span>
          <span className="meta-separator">/</span>
          <span>{categoryLabel(example.category)}</span>
          <span className="meta-separator">/</span>
          <span>{example.language}</span>
        </div>
        <span className="case-counter">
          CASE {String(position).padStart(2, "0")} <span>OF {String(total).padStart(2, "0")}</span>
        </span>
      </div>

      <div className="conversation-card__model-row">
        <span className="model-chip">
          <span className="model-chip__dot" />
          {example.model}
        </span>
        <span className="conversation-card__turn-label">PRESSURE TEST · 3 STAGES</span>
      </div>

      <div className="conversation-timeline">
        <span className="conversation-timeline__line" aria-hidden="true" />
        <Turn kind="user" speaker="User · question" number="01" text={example.question} />
        <Turn kind="model" speaker={example.model} number="02" text={example.initialResponse} />
        <Turn kind="pushback" speaker="User · pushback" number="03" text={example.pushback} />
        <Turn kind="final" speaker={example.model} number="04" text={example.finalResponse} />
      </div>

      <div className="reference-answer">
        <span className="reference-answer__icon">
          <Check size={14} aria-hidden="true" />
        </span>
        <div>
          <span>REFERENCE ANSWER</span>
          <strong>{example.referenceAnswer}</strong>
        </div>
      </div>
    </section>
  );
}

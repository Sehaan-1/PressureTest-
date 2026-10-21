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
  tag,
}: {
  kind: "user" | "model" | "pushback" | "final";
  speaker: string;
  text: string;
  tag?: string;
}) {
  return (
    <li className={`conversation-turn conversation-turn--${kind}`}>
      <div className="conversation-turn__header">
        <strong>{speaker}</strong>
        {tag ? <span className={`turn-tag turn-tag--${kind}`}>{tag}</span> : null}
      </div>
      <p>{text}</p>
    </li>
  );
}

export function ConversationCard({ example, position, total }: ConversationCardProps) {
  return (
    <section className="panel conversation-card" aria-label="Three-turn model conversation">
      <div className="conversation-card__header">
        <div className="conversation-card__meta">
          <code className="mono-id">{example.id}</code>
          <span aria-hidden="true">·</span>
          <span>{categoryLabel(example.category)}</span>
          <span aria-hidden="true">·</span>
          <span>{example.language}</span>
        </div>
        <span className="meta-stamp">
          Case {position} of {total}
        </span>
      </div>

      <div className="conversation-card__model-row">
        <span className="status-pill-neutral">{example.model}</span>
        <span className="meta-stamp">Question, response, pushback, final response</span>
      </div>

      <ol className="conversation-turns">
        <Turn kind="user" speaker="User prompt" text={example.question} />
        <Turn
          kind="model"
          speaker={`${example.model} · initial response`}
          text={example.initialResponse}
        />
        <Turn kind="pushback" speaker="User pushback" tag="Challenge" text={example.pushback} />
        <Turn
          kind="final"
          speaker={`${example.model} · final response`}
          tag="Final answer"
          text={example.finalResponse}
        />
      </ol>

      <div className="reference-answer">
        <span className="reference-answer__label">Reference answer</span>
        <strong>{example.referenceAnswer}</strong>
      </div>
    </section>
  );
}

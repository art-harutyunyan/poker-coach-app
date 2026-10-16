import { ArrowRight, CircleAlert, CircleCheck, Target } from "lucide-react";
import type { ReviewQueueItem } from "../../domain/schemas";

export function ReviewQueue({
  compact,
  items,
  onOpenItem,
}: {
  compact?: boolean;
  items: ReviewQueueItem[];
  onOpenItem: (item: ReviewQueueItem) => void;
}) {
  return (
    <section className="reviewQueue">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Focused study queue</p>
          <h2>{compact ? "Next hands" : "Tournament Review Queue"}</h2>
        </div>
        <div className="pill">{items.length} spots</div>
      </div>
      <div className="reviewList">
        {items.map((item) => (
          <button
            className="reviewItem"
            data-grade={item.grade}
            key={item.id}
            onClick={() => onOpenItem(item)}
            type="button"
          >
            <span className="reviewIcon">{iconForGrade(item.grade)}</span>
            <span className="reviewMain">
              <strong>{item.title}</strong>
              <small>{item.description}</small>
            </span>
            <span className="reviewMeta">
              <b>{item.category}</b>
              <small>
                {item.severity} / {item.confidence}
              </small>
            </span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}

function iconForGrade(grade: ReviewQueueItem["grade"]) {
  if (grade === "EXCELLENT" || grade === "GOOD") {
    return <CircleCheck size={18} aria-hidden="true" />;
  }

  if (grade === "MAJOR_MISTAKE") {
    return <CircleAlert size={18} aria-hidden="true" />;
  }

  return <Target size={18} aria-hidden="true" />;
}

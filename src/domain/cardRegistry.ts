import type { Card } from "./schemas";
import { HandHistoryValidationError, type SourceLocation } from "./handHistory";

/** Repeated observations are allowed; distinct owners cannot share a card. */
export class CardRegistry {
  private readonly owners = new Map<string, string>();
  private readonly known = new Map<string, Set<string>>();

  observe(
    owner: string,
    cards: readonly Card[],
    source: SourceLocation,
    maximum = 2,
  ): void {
    const codes = cards.map((c) => c.rank + c.suit);
    if (new Set(codes).size !== codes.length)
      this.invalid("Duplicate card in a single observation", source);
    const known = this.known.get(owner) ?? new Set<string>();
    for (const code of codes) {
      const previous = this.owners.get(code);
      if (previous !== undefined && previous !== owner)
        this.invalid(`Physical card ${code} belongs to multiple owners`, source);
      known.add(code);
      if (known.size > maximum)
        this.invalid("Conflicting card observations for the same owner", source);
      this.owners.set(code, owner);
    }
    this.known.set(owner, known);
  }
  private invalid(message: string, source: SourceLocation): never {
    throw new HandHistoryValidationError("invalid_card", message, source);
  }
}

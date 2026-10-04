import type {
  BeforeOrAfterMatchup,
  ContentItem,
  MovieCard,
  WhatsCommonRound,
} from '../types/game';

/**
 * Structural checks for local content. Run by the test suite (and in dev on
 * launch) so new card packs can be added with confidence.
 */
export function validateContent(content: {
  movieOnMyHead: readonly MovieCard[];
  whatsCommon: readonly WhatsCommonRound[];
  beforeOrAfter: readonly BeforeOrAfterMatchup[];
}): string[] {
  const problems: string[] = [];

  const checkIds = (name: string, items: readonly ContentItem[]) => {
    const seen = new Set<string>();
    for (const item of items) {
      if (!item.id) problems.push(`${name}: item without id`);
      if (seen.has(item.id)) problems.push(`${name}: duplicate id ${item.id}`);
      seen.add(item.id);
    }
    if (items.length === 0) problems.push(`${name}: no content`);
  };

  checkIds('movieOnMyHead', content.movieOnMyHead);
  checkIds('whatsCommon', content.whatsCommon);
  checkIds('beforeOrAfter', content.beforeOrAfter);

  for (const card of content.movieOnMyHead) {
    if (!card.title.trim()) problems.push(`movieOnMyHead ${card.id}: empty title`);
  }

  for (const round of content.whatsCommon) {
    if (round.clues.length !== 3 || round.clues.some((c) => !c.trim())) {
      problems.push(`whatsCommon ${round.id}: needs exactly three non-empty clues`);
    }
    if (!round.answer.trim()) problems.push(`whatsCommon ${round.id}: empty answer`);
  }

  for (const m of content.beforeOrAfter) {
    if (!m.a.title.trim() || !m.b.title.trim()) {
      problems.push(`beforeOrAfter ${m.id}: empty title`);
    }
    if (m.a.title === m.b.title) problems.push(`beforeOrAfter ${m.id}: same movie twice`);
    if (m.correct !== 'a' && m.correct !== 'b') {
      problems.push(`beforeOrAfter ${m.id}: correct must be "a" or "b"`);
    }
    const first = m.correct === 'a' ? m.a : m.b;
    const other = m.correct === 'a' ? m.b : m.a;
    if (first.year > other.year) {
      problems.push(`beforeOrAfter ${m.id}: correct movie has a later year`);
    }
  }

  return problems;
}

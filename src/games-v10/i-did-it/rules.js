export function resolveFingerSelection({ players, fingers, eliminated, selected }) {
  const before = players.filter(player => !eliminated.has(player.id));
  const nextFingers = new Map(fingers);
  const nextEliminated = new Set(eliminated);
  const didNot = before.filter(player => selected.has(player.id));
  const did = before.filter(player => !selected.has(player.id));
  const newlyEliminated = [];

  for (const player of didNot) {
    const next = Math.max(0, (nextFingers.get(player.id) || 0) - 1);
    nextFingers.set(player.id, next);
    if (next === 0) {
      nextEliminated.add(player.id);
      newlyEliminated.push(player);
    }
  }

  const survivors = players.filter(player => !nextEliminated.has(player.id));
  return { before, didNot, did, newlyEliminated, survivors, fingers: nextFingers, eliminated: nextEliminated };
}

export function resolveImmunePlayer({ before, survivors, random }) {
  if (survivors.length === 1) return { winner: survivors[0], randomImmune: false };
  if (survivors.length === 0 && before.length) return { winner: random.pick(before), randomImmune: true };
  return { winner: null, randomImmune: false };
}

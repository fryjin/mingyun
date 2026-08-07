export const SPEECH_OPTIONS = Object.freeze([0, 15, 30, 45, 60]);

export function normalizeUndercoverCount(count, playerCount) {
  return Math.min(Math.max(1, Number(count) || 1), Math.max(1, playerCount - 2), 3);
}

export function assignRoles(players, undercoverCount, random) {
  const ids = new Set(random.shuffle(players).slice(0, undercoverCount).map(player => player.id));
  return new Map(players.map(player => [player.id, ids.has(player.id) ? 'undercover' : 'civilian']));
}

export function wordForPlayer(playerId, roles, pair) {
  return roles.get(playerId) === 'undercover' ? pair.undercover : pair.civilian;
}

export function resolveVote({ alive, votes, random }) {
  const counts = new Map(alive.map(player => [player.id, 0]));
  votes.forEach(id => counts.set(id, (counts.get(id) || 0) + 1));
  const maximum = Math.max(...counts.values());
  const tied = alive.filter(player => counts.get(player.id) === maximum);
  return { counts, tied, eliminated: random.pick(tied) };
}

export function resolveWinner(alive, roles) {
  const undercoverAlive = alive.filter(player => roles.get(player.id) === 'undercover').length;
  const civilianAlive = alive.length - undercoverAlive;
  if (undercoverAlive === 0) return 'civilian';
  if (undercoverAlive >= civilianAlive) return 'undercover';
  return null;
}

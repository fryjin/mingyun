export function assignKingNumbers(players, random) {
  const numbers = random.shuffle(Array.from({ length: players.length }, (_, index) => index + 1));
  return new Map(players.map((player, index) => [player.id, numbers[index]]));
}

export function formatKingInstruction(text, targetNumbers) {
  return String(text || '').replace(/\{target(\d+)\}/g, (_, number) => `${targetNumbers[Number(number) - 1]}号`);
}

export function selectKingTargets({ assignment, kingId, instruction, random }) {
  const kingNumber = assignment.get(kingId);
  const available = [...assignment.values()].filter(number => instruction.allowKingAsTarget || number !== kingNumber);
  const targetCount = Math.max(0, Number(instruction.targetCount) || 0);
  if (targetCount > available.length) throw new RangeError('当前任务需要的执行人数超过可用玩家数');
  return random.shuffle(available).slice(0, targetCount);
}

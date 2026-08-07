export function validateStoryPrompts(values) {
  const prompts = values.map(value => String(value || '').trim());
  if (prompts.some(value => !value)) return { ok: false, error: '三个提示词都需要填写。', prompts };
  if (new Set(prompts).size !== prompts.length) return { ok: false, error: '三个提示词不能完全相同。', prompts };
  return { ok: true, error: '', prompts };
}

export function voteGroups({ voters, votes, lieIndex }) {
  if (lieIndex === null || lieIndex === undefined) return { correct: [], wrong: [] };
  return {
    correct: voters.filter(player => votes.get(player.id) === lieIndex),
    wrong: voters.filter(player => votes.get(player.id) !== lieIndex)
  };
}

export function votersForStory(voters, votes, storyIndex) {
  return voters.filter(player => votes.get(player.id) === storyIndex);
}

export function punishmentTarget({ narrator, wrong }) {
  if (!wrong.length) return { allCorrect: true, players: [narrator] };
  return {
    allCorrect: false,
    players: [{ id: 'offline-selected-player', name: '讲述者指定的玩家' }]
  };
}

export const isArtifact = card => card?.set === 'Artifacts' || card?.type === 'artifact';
export const deckAge = card => card.deck_age ?? card.age;
export const boardAge = card => card.board_age ?? card.age;
export const digQualifies = (covering, covered) => !!covered && (
  boardAge(covered) >= boardAge(covering) ||
  covering.spots.some((icon, slot) => icon === 0 && covered.spots[slot] === 0)
);
export const museumCount = player => (player.museum || []).length;
export const museumAchievementCount = player => (player.museumAchievements || []).length;
export const displayIcons = (player, card) => {
  const counts = {};
  for (const id of player.display || []) for (const icon of card(id).spots) {
    if ([1,2,3,4,5,6,7,18].includes(icon)) counts[icon] = (counts[icon] || 0) + 1;
  }
  return counts;
};

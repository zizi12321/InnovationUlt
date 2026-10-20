export const isDemand = effect => effect.kind === 'i_demand_effect';

export function dogmaTypeLabel(card, includesEcho = false) {
  const labels = [];
  if (card.effects.some(isDemand)) labels.push('要求');
  if (includesEcho || card.effects.some(effect => !isDemand(effect))) labels.push('条例');
  return labels.join('＋');
}

// These same comparisons drive both the pre-action hint and execution.
// Eligibility is locked at the start; it does not predict later choices,
// hidden card identities, or the indirect targets of non-demand effects.
export function dogmaEligibility(card, ownIcons, rivalIcons) {
  const own = ownIcons[card.dogma_icon] || 0, rival = rivalIcons[card.dogma_icon] || 0;
  return { own, rival, vulnerable: rival < own, share: rival >= own };
}

// Ultimate 4.1, pp. 21, 24–25. Echo and bonus marks occupy printed icon slots;
// they are not standard icons and never enter demand/share comparisons.
export const isEcho = effect => effect.kind === 'echo_effect';
export const isBonus = code => code >= 101 && code <= 112;
export const bonusValue = code => code - 100;
export function forecastLimit(player) {
  const rank = { none: 0, left: 1, right: 2, up: 3, aslant: 4 };
  return 5 - Math.max(0, ...Object.values(player.splay).map(direction => rank[direction]));
}
export function totalBonus(values) {
  return values.length ? Math.max(...values) + values.length - 1 : 0;
}

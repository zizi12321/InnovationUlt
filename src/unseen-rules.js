import { forecastLimit } from './echoes-rules.js';
import { cardSet } from './expansions.js';

// Ultimate 4.1 p.31: Safe and Forecast have the same capacity table.
export const safeLimit = forecastLimit;
export const secretBacks = (owner, card) => (owner.safe || []).map((id, index) => ({
  age: card(id).age, set: cardSet(card(id)), order: index + 1,
}));
export const secretToken = (owner, index) => `secret:${owner}:${index}`;

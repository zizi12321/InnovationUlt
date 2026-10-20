import { FIGURES_RED } from './effects-figures-red.js';
import { FIGURES_YELLOW } from './effects-figures-yellow.js';
import { FIGURES_GREEN } from './effects-figures-green.js';
import { FIGURES_BLUE } from './effects-figures-blue.js';
import { FIGURES_PURPLE } from './effects-figures-purple.js';

export const FIGURE_EFFECTS = Object.fromEntries(Object.entries({
  ...FIGURES_RED,
  ...FIGURES_YELLOW,
  ...FIGURES_GREEN,
  ...FIGURES_BLUE,
  ...FIGURES_PURPLE,
}).sort(([a],[b])=>a.localeCompare(b)));

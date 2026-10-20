import { BASE_RED_EFFECTS } from './effects-base-red.js';
import { BASE_YELLOW_EFFECTS } from './effects-base-yellow.js';
import { BASE_GREEN_EFFECTS } from './effects-base-green.js';
import { BASE_BLUE_EFFECTS } from './effects-base-blue.js';
import { BASE_PURPLE_EFFECTS } from './effects-base-purple.js';
import { ECHOES_RED_EFFECTS } from './effects-echoes-red.js';
import { ECHOES_YELLOW_EFFECTS } from './effects-echoes-yellow.js';
import { ECHOES_GREEN_EFFECTS } from './effects-echoes-green.js';
import { ECHOES_BLUE_EFFECTS } from './effects-echoes-blue.js';
import { ECHOES_PURPLE_EFFECTS } from './effects-echoes-purple.js';
import { ZERO_RED_EFFECTS } from './effects-zero-red.js';
import { ZERO_YELLOW_EFFECTS } from './effects-zero-yellow.js';
import { ZERO_GREEN_EFFECTS } from './effects-zero-green.js';
import { ZERO_BLUE_EFFECTS } from './effects-zero-blue.js';
import { ZERO_PURPLE_EFFECTS } from './effects-zero-purple.js';
import { ARTIFACTS_RED_EFFECTS } from './effects-artifacts-red.js';
import { ARTIFACTS_YELLOW_EFFECTS } from './effects-artifacts-yellow.js';
import { ARTIFACTS_GREEN_EFFECTS } from './effects-artifacts-green.js';
import { ARTIFACTS_BLUE_EFFECTS } from './effects-artifacts-blue.js';
import { ARTIFACTS_PURPLE_EFFECTS } from './effects-artifacts-purple.js';
import { UNSEEN_RED_EFFECTS } from './effects-unseen-red.js';
import { UNSEEN_YELLOW_EFFECTS } from './effects-unseen-yellow.js';
import { UNSEEN_GREEN_EFFECTS } from './effects-unseen-green.js';
import { UNSEEN_BLUE_EFFECTS } from './effects-unseen-blue.js';
import { UNSEEN_PURPLE_EFFECTS } from './effects-unseen-purple.js';

// This module only registers effects; each set's programs live in five color files.
// Preserve the original B001–B115 registry order for existing consumers.
export const EFFECTS = Object.fromEntries(
  Object.entries({
    ...BASE_RED_EFFECTS,
    ...BASE_YELLOW_EFFECTS,
    ...BASE_GREEN_EFFECTS,
    ...BASE_BLUE_EFFECTS,
    ...BASE_PURPLE_EFFECTS,
    ...ECHOES_RED_EFFECTS,
    ...ECHOES_YELLOW_EFFECTS,
    ...ECHOES_GREEN_EFFECTS,
    ...ECHOES_BLUE_EFFECTS,
    ...ECHOES_PURPLE_EFFECTS,
    ...ZERO_RED_EFFECTS,
    ...ZERO_YELLOW_EFFECTS,
    ...ZERO_GREEN_EFFECTS,
    ...ZERO_BLUE_EFFECTS,
    ...ZERO_PURPLE_EFFECTS,
    ...ARTIFACTS_RED_EFFECTS,
    ...ARTIFACTS_YELLOW_EFFECTS,
    ...ARTIFACTS_GREEN_EFFECTS,
    ...ARTIFACTS_BLUE_EFFECTS,
    ...ARTIFACTS_PURPLE_EFFECTS,
    ...UNSEEN_RED_EFFECTS,
    ...UNSEEN_YELLOW_EFFECTS,
    ...UNSEEN_GREEN_EFFECTS,
    ...UNSEEN_BLUE_EFFECTS,
    ...UNSEEN_PURPLE_EFFECTS,
  }).sort(([a], [b]) => a.localeCompare(b))
);

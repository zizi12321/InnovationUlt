import { CITY_ARROWS } from './cities-rules.js';
import { junkDeck, junkAchievement } from './effect-helpers.js';

// Printed city icons, in top-then-bottom order. These are Meld-action
// triggers, never Dogma programs and never triggered by a meld from an effect.
export function cityEffect(slot, icon, search = false) {
  return { slot, icon, search, *run(c, p, definition) {
    if (search) yield* c.citySearch(p, definition.age, icon);
    else if (CITY_ARROWS[icon]) c.splay(p, definition.color, CITY_ARROWS[icon]);
    else if (icon === 14) c.draw(p, definition.age + 1);
    else if (icon === 15) yield* junkAchievement(c, p, [definition.age]);
    else if (icon === 16) { junkDeck(c, p, definition.age + 1); c.draw(p, definition.age + 2); }
    else if (icon === 17) { for (const owner of c.rawPlayers()) if (owner.id !== p) c.splay(owner.id, definition.color, 'none', owner.id); }
    else throw new Error(`未知城市即时图标：${icon}`);
  } };
}

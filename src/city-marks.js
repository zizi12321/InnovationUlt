// Native vectors keep special symbols crisp at every card size and inherit
// the card's color. Search retains the standard icon beneath its magnifier.
const shapes = {
  8: '<path d="M10 29V6m1 1c6-5 9 5 17 0v12c-8 5-11-5-17 0"/>',
  9: '<path d="M17 5v24m-8 0h16M12 8q5-9 10 0M8 11h18q-1 7-9 7t-9-7Zm-3 9h24q-2 7-12 7T5 20Z"/>',
  11: '<path d="M6 17 17 7v7h12v6H17v7Z"/>',
  12: '<path d="m28 17-11-10v7H5v6h12v7Z"/>',
  13: '<path d="M17 5 7 16h7v13h6V16h7Z"/>',
  14: '<path d="M14 5h6v9h9v6h-9v9h-6v-9H5v-6h9Z"/>',
  15: '<path d="m9 5 8 8 8-8 4 4-8 8 8 8-4 4-8-8-8 8-4-4 8-8-8-8Z"/>',
  16: '<path d="m17 3-7 8h5v10l-6-6-4 4 8 8-4 4 4 2 4-4 4 4 4-2-4-4 8-8-4-4-6 6V11h5Z"/>',
  17: '<path d="M15 4h4v7h4l-6 6-6-6h4ZM15 30h4v-7h4l-6-6-6 6h4ZM4 15v4h7v4l6-6-6-6v4ZM30 15v4h-7v4l-6-6 6-6v4Z"/>',
};
export const citySymbolHTML = code => shapes[code] ? `<svg class="city-symbol city-symbol-${code}" viewBox="0 0 34 34" aria-hidden="true">${shapes[code]}</svg>` : '';
export const searchBadgeHTML = '<svg class="search-badge" viewBox="0 0 20 20" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/><path d="m12 12 6 6"/></svg>';

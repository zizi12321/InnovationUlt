import { cityEffect } from './effects-cities-helpers.js';

// 命运之城 · GREEN · 按官方卡面先上后下执行。
export const CITIES_GREEN = {
  C007: [cityEffect(5, 16)], // 巴比伦
  C008: [cityEffect(5, 4, true)], // 耶路撒冷
  C009: [cityEffect(5, 4, true)], // 孟菲斯
  C020: [cityEffect(5, 1, true)], // 马赛
  C021: [cityEffect(5, 4, true)], // 南京
  C030: [cityEffect(5, 11)], // 巴格达
  C031: [cityEffect(5, 14)], // 威尼斯
  C040: [cityEffect(5, 2, true)], // 卡利卡特
  C041: [cityEffect(5, 11)], // 马尼拉
  C050: [cityEffect(5, 14), cityEffect(2, 16)], // 阿姆斯特丹
  C051: [], // 斯德哥尔摩
  C060: [cityEffect(5, 12)], // 孟买
  C061: [], // 里约热内卢
  C070: [cityEffect(5, 12), cityEffect(2, 16)], // 伦敦
  C071: [], // 多伦多
  C080: [cityEffect(5, 15)], // 汉堡
  C081: [], // 圣保罗
  C090: [], // 圣地亚哥
  C091: [cityEffect(2, 13)], // 悉尼
  C100: [], // 曼谷
  C101: [cityEffect(5, 17), cityEffect(2, 13)], // 特拉维夫
  C110: [cityEffect(5, 17)], // 贝鲁特
  C111: [], // 利雅得
};

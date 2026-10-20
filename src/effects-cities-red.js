import { cityEffect } from './effects-cities-helpers.js';

// 命运之城 · RED · 按官方卡面先上后下执行。
export const CITIES_RED = {
  C001: [cityEffect(5, 14)], // 雅典
  C002: [cityEffect(5, 14)], // 长安
  C003: [cityEffect(5, 3, true)], // 底比斯
  C016: [cityEffect(5, 15)], // 斯巴达
  C017: [cityEffect(5, 4, true)], // 蒂卡尔
  C026: [cityEffect(5, 14)], // 巴塞罗那
  C027: [cityEffect(5, 11)], // 德里
  C036: [cityEffect(5, 14), cityEffect(2, 16)], // 米兰
  C037: [cityEffect(5, 11)], // 特诺奇蒂特兰
  C046: [], // 阿尔及尔
  C047: [cityEffect(5, 15)], // 苏黎世
  C056: [cityEffect(5, 14), cityEffect(2, 14)], // 费城
  C057: [cityEffect(2, 12)], // 德黑兰
  C066: [cityEffect(2, 12)], // 里昂
  C067: [cityEffect(5, 15), cityEffect(2, 14)], // 蒙特利尔
  C076: [], // 吉隆坡
  C077: [], // 洛杉矶
  C086: [cityEffect(5, 13), cityEffect(2, 14)], // 达拉斯
  C087: [], // 珀斯
  C096: [cityEffect(5, 17), cityEffect(2, 13)], // 首尔
  C097: [cityEffect(5, 14)], // 新加坡
  C106: [], // 广州
  C107: [cityEffect(5, 17)], // 华沙
};

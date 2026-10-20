import { cityEffect } from './effects-cities-helpers.js';

// 命运之城 · BLUE · 按官方卡面先上后下执行。
export const CITIES_BLUE = {
  C010: [cityEffect(5, 4, true)], // 亚特兰蒂斯
  C011: [cityEffect(5, 15)], // 特洛伊
  C012: [cityEffect(5, 4, true)], // 殷
  C022: [cityEffect(5, 14)], // 亚历山德里亚
  C023: [cityEffect(5, 14)], // 迦太基
  C032: [cityEffect(5, 11)], // 科尔多瓦
  C033: [cityEffect(5, 16)], // 杭州
  C042: [cityEffect(5, 14), cityEffect(2, 14)], // 法兰克福
  C043: [cityEffect(5, 11)], // 马德里
  C052: [cityEffect(5, 14), cityEffect(2, 14)], // 波士顿
  C053: [cityEffect(5, 14), cityEffect(2, 14)], // 那不勒斯
  C062: [cityEffect(2, 12)], // 柏林
  C063: [cityEffect(5, 14), cityEffect(2, 14)], // 爱丁堡
  C072: [], // 约翰内斯堡
  C073: [cityEffect(5, 12), cityEffect(2, 14)], // 慕尼黑
  C082: [cityEffect(5, 14), cityEffect(2, 16)], // 重庆
  C083: [cityEffect(5, 14), cityEffect(2, 14)], // 基辅
  C092: [], // 休斯顿
  C093: [cityEffect(2, 13)], // 台北
  C102: [cityEffect(5, 14)], // 亚特兰大
  C103: [cityEffect(5, 17), cityEffect(2, 13)], // 班加罗尔
  C112: [], // 布拉格
  C113: [cityEffect(5, 17)], // 西雅图
};

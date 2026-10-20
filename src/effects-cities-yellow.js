import { cityEffect } from './effects-cities-helpers.js';

// 命运之城 · YELLOW · 按官方卡面先上后下执行。
export const CITIES_YELLOW = {
  C004: [cityEffect(5, 4, true)], // 大马士革
  C005: [cityEffect(5, 4, true)], // 临淄
  C006: [cityEffect(5, 4, true)], // 乌鲁克
  C018: [cityEffect(5, 2, true)], // 尼尼微
  C019: [cityEffect(5, 2, true)], // 特奥蒂华坎
  C028: [cityEffect(5, 15)], // 雅加达
  C029: [cityEffect(5, 11)], // 开封
  C038: [cityEffect(5, 11)], // 北京
  C039: [cityEffect(5, 14), cityEffect(2, 14)], // 里斯本
  C048: [cityEffect(5, 1, true)], // 会安
  C049: [cityEffect(5, 3, true)], // 大阪
  C058: [cityEffect(5, 15), cityEffect(2, 12)], // 都柏林
  C059: [], // 巴黎
  C068: [], // 墨尔本
  C069: [cityEffect(2, 12)], // 圣彼得堡
  C078: [], // 芝加哥
  C079: [], // 上海
  C088: [cityEffect(5, 13), cityEffect(2, 14)], // 瓜达拉哈拉
  C089: [], // 迈阿密
  C098: [cityEffect(5, 17), cityEffect(2, 13)], // 哥本哈根
  C099: [cityEffect(5, 14)], // 迪拜
  C108: [], // 内罗毕
  C109: [cityEffect(5, 17)], // 深圳
};

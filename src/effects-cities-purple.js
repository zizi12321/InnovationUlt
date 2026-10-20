import { cityEffect } from './effects-cities-helpers.js';

// 命运之城 · PURPLE · 按官方卡面先上后下执行。
export const CITIES_PURPLE = {
  C013: [cityEffect(5, 14)], // 以弗所
  C014: [cityEffect(5, 4, true)], // 哈图沙
  C015: [cityEffect(5, 14)], // 摩亨佐-达罗
  C024: [cityEffect(5, 16)], // 洛阳
  C025: [cityEffect(5, 3, true)], // 罗马
  C034: [cityEffect(5, 11)], // 君士坦丁堡
  C035: [cityEffect(5, 2, true)], // 麦加
  C044: [cityEffect(5, 11)], // 佛罗伦萨
  C045: [cityEffect(5, 15)], // 塞维利亚
  C054: [], // 格但斯克
  C055: [], // 东京
  C064: [cityEffect(5, 14), cityEffect(2, 16)], // 纽约城
  C065: [cityEffect(5, 12)], // 维也纳
  C074: [], // 旧金山
  C075: [cityEffect(2, 12)], // 华盛顿
  C084: [], // 布宜诺斯艾利斯
  C085: [cityEffect(5, 14), cityEffect(2, 14)], // 温哥华
  C094: [cityEffect(5, 13), cityEffect(2, 16)], // 香港
  C095: [cityEffect(2, 15)], // 莫斯科
  C104: [cityEffect(5, 15)], // 布鲁塞尔
  C105: [cityEffect(5, 17), cityEffect(2, 13)], // 拉各斯
  C114: [], // 布里斯班
  C115: [cityEffect(5, 17)], // 利马
};

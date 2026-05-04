export type HobbyPhoto = {
  image: string;
  location: string;
  date: string;
  note: string;
};

import hikingTaizhouGongyuyan from "@/assets/hiking/台州公盂岩.jpg";
import hikingTaizhouFeiyingdao from "@/assets/hiking/台州飞鹰道.jpg";
import hikingNingboDonghaiYunding from "@/assets/hiking/宁波东海云顶.jpg";
import hikingXuanchengTiejiangshan from "@/assets/hiking/宣城铁匠山.jpg";
import hikingChizhouJiuhuashan from "@/assets/hiking/池州九华山.jpg";
import hikingShaoxingFujishan from "@/assets/hiking/绍兴覆卮山.jpg";
import travelBeijing from "@/assets/travel/北京.jpg";
import travelGuangzhou from "@/assets/travel/广州.jpg";
import travelXuzhou from "@/assets/travel/徐州.jpg";
import travelLuoyang from "@/assets/travel/洛阳.jpg";
import travelShaoxing from "@/assets/travel/绍兴.jpg";
import travelChongqing from "@/assets/travel/重庆.jpg";

function getAssetSrc(asset: string | { src: string }) {
  return typeof asset === "string" ? asset : asset.src;
}

export const hiking: HobbyPhoto[] = [
  {
    image: getAssetSrc(hikingTaizhouGongyuyan),
    location: "台州公盂岩",
    date: "2025.10",
    note: "和稻草人的第一条线，公盂背真的有点难爬！住宿条件也是一言难尽，但是遇到了非常多真诚的好朋友们！",
  },
  {
    image: getAssetSrc(hikingTaizhouFeiyingdao),
    location: "台州飞鹰道",
    date: "2025.11",
    note: "稻草人第二条线，据说是神奇的玄学线（每次走完都会有人遇到新人或者离开旧人），果然一个月后领队和队里一个女生在一起了哈哈哈哈",
  },
  {
    image: getAssetSrc(hikingNingboDonghaiYunding),
    location: "宁波东海云顶",
    date: "2025.12",
    note: "时隔14个月后重返萤火虫，至今没有写人物志sos，想念日出！",
  },
  {
    image: getAssetSrc(hikingXuanchengTiejiangshan),
    location: "宣城铁匠山",
    date: "2024.10",
    note: "徒步入坑线+萤火虫第一条线，上来就选了一条难度三星线，从此打开新世界的大门（虽然越走越腐败^ ^）～",
  },
  {
    image: getAssetSrc(hikingChizhouJiuhuashan),
    location: "池州九华山",
    date: "2026.01",
    note: "登协第二条线，最喜欢走这种体能消耗大但是难度不高的线路了哈哈哈，吃得最好的一条线！",
  },
  {
    image: getAssetSrc(hikingShaoxingFujishan),
    location: "绍兴覆卮山",
    date: "2025.10",
    note: "第一条登协线，也是第一条单日线，纯拉练来的，30度爬大石头完全被小孩哥拉爆=。=",
  },
];

export const travel: HobbyPhoto[] = [
  {
    image: getAssetSrc(travelBeijing),
    location: "北京",
    date: "2026.02",
    note: "白天想夜里哭，做梦都想去首都",
  },
  {
    image: getAssetSrc(travelGuangzhou),
    location: "广州",
    date: "2024.02",
    note: "边度有好嘢食？",
  },
  {
    image: getAssetSrc(travelXuzhou),
    location: "徐州",
    date: "2024.08",
    note: "徐州人还挺能吃辣的=。=",
  },
  {
    image: getAssetSrc(travelLuoyang),
    location: "洛阳",
    date: "2024.08",
    note: "物价比较低的好地方，面食爱好者天堂来的",
  },
  {
    image: getAssetSrc(travelShaoxing),
    location: "绍兴",
    date: "2025.10",
    note: "除了鲁迅故居还能想起什么绍兴关键词？去完了还是只记得鲁迅故居=。=",
  },
  {
    image: getAssetSrc(travelChongqing),
    location: "重庆",
    date: "2023.09",
    note: "爱乐之城不是在洛杉矶拍的，而是在重庆拍的！",
  },
];

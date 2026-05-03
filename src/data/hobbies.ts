export type HobbyPhoto = {
  image: string;
  location: string;
  date: string;
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
    date: "日期待补充",
  },
  {
    image: getAssetSrc(hikingTaizhouFeiyingdao),
    location: "台州飞鹰道",
    date: "日期待补充",
  },
  {
    image: getAssetSrc(hikingNingboDonghaiYunding),
    location: "宁波东海云顶",
    date: "日期待补充",
  },
  {
    image: getAssetSrc(hikingXuanchengTiejiangshan),
    location: "宣城铁匠山",
    date: "日期待补充",
  },
  {
    image: getAssetSrc(hikingChizhouJiuhuashan),
    location: "池州九华山",
    date: "日期待补充",
  },
  {
    image: getAssetSrc(hikingShaoxingFujishan),
    location: "绍兴覆卮山",
    date: "日期待补充",
  },
];

export const travel: HobbyPhoto[] = [
  {
    image: getAssetSrc(travelBeijing),
    location: "北京",
    date: "",
  },
  {
    image: getAssetSrc(travelGuangzhou),
    location: "广州",
    date: "",
  },
  {
    image: getAssetSrc(travelXuzhou),
    location: "徐州",
    date: "",
  },
  {
    image: getAssetSrc(travelLuoyang),
    location: "洛阳",
    date: "",
  },
  {
    image: getAssetSrc(travelShaoxing),
    location: "绍兴",
    date: "",
  },
  {
    image: getAssetSrc(travelChongqing),
    location: "重庆",
    date: "",
  },
];

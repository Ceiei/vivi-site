export type Publication = {
  slug: string;
  title: string;
  authors: string[];
  venue: string;
  year: number;
  status: string;
  abstract: string;
  summary: string;
  highlights: string[];
  contributions: string[];
  results: string[];
  openreviewUrl?: string;
  arxivUrl: string;
  doiUrl: string;
  pdfUrl: string;
};

export const publications: Publication[] = [
  {
    slug: "conditionally-whitened-generative-models",
    title:
      "Conditionally Whitened Generative Models for Probabilistic Time Series Forecasting",
    authors: [
      "Yanfeng Yang",
      "Siwei Chen",
      "Pingping Hu",
      "Zhaotong Shen",
      "Yingjie Zhang",
      "Zhuoran Sun",
      "Shuai Li",
      "Ziqi Chen",
      "Kenji Fukumizu",
    ],
    venue: "ICLR",
    year: 2026,
    status: "Accepted",
    abstract:
      "多变量时间序列的概率预测需要同时处理非平稳性、变量间依赖、预测不确定性以及训练集和测试集之间的分布偏移。本文提出 Conditionally Whitened Generative Models（CW-Gen），通过条件白化将条件均值和条件协方差信息注入生成式预测模型。理论上，论文分析了用由条件均值和协方差估计器参数化的数据依赖高斯先验，替代扩散模型标准终端分布时能够改善样本质量的充分条件；方法上，论文基于 Joint Mean-Covariance Estimator（JMCE）构建了 CW-Diff 和 CW-Flow 两个实例。",
    summary:
      "论文首先指出，传统时间序列模型在现代高维复杂数据上能力有限，而许多神经网络预测模型主要关注条件均值预测，难以充分刻画未来序列的不确定性。概率时间序列预测的目标是学习给定历史观测后未来轨迹的完整条件分布。近年来，扩散模型和 Flow Matching 方法提升了条件生成能力，但很多方法要么忽略可由历史信息得到的先验，要么只使用较弱的均值或方差先验，仍然无法充分处理多变量协方差结构和分布偏移问题。",
    highlights: [
      "研究任务：给定历史观测序列，模型需要学习未来多变量时间序列的条件分布，而不是只输出单一的点预测结果。",
      "核心挑战：未来序列通常同时包含长期趋势、季节性、异方差、短期波动、多变量相关性，以及训练和测试阶段可能出现的分布偏移。",
      "方法动机：先验信息可以降低条件生成建模难度，但已有方法仍缺少对先验为何有效、先验估计需要多准确、以及先验注入机制能否简化的系统回答。",
    ],
    contributions: [
      "提出统一的条件生成框架 CW-Gen，并给出两个具体实例：Conditionally Whitened Diffusion Models（CW-Diff）和 Conditionally Whitened Flow Matching（CW-Flow）。",
      "提供理论分析，说明在什么条件下，用条件均值和协方差估计器定义的高斯先验替代标准高斯终端分布，可以提升生成样本质量。",
      "设计 Joint Mean-Covariance Estimator（JMCE），联合估计条件均值和滑动窗口协方差，并通过控制协方差特征值提升生成建模的稳定性。",
      "将若干已有的先验增强扩散模型纳入 CW-Gen 视角，并展示该框架可以无缝集成到多种扩散模型和 Flow Matching 时间序列预测模型中。",
    ],
    results: [
      "实验设置：论文在 ETTh1、ETTh2、ILI、Weather 和 Solar Energy 五个真实时间序列数据集上评估 CW-Gen，并选取五个扩散模型和一个 Flow Matching 模型作为基础模型。",
      "概率预测效果：在论文 Tables 2-6 中，CW-Gen 在大量设置下降低了 CRPS 和 QICE，并整体降低 ProbCorr 和 Conditional FID，说明其能够提升预测精度、变量相关性建模能力和生成样本质量。",
      "点预测表现：附录中的 ProbMSE 和 ProbMAE 结果表明，CW-Gen 不仅增强概率预测能力，也在多数模型-数据集组合中改善了点预测表现。",
      "可视化结论：样本图显示，条件白化可以缓解均值和方差偏移，在分布偏移场景下生成更细致、更稳定的未来序列样本。",
    ],
    openreviewUrl: "",
    arxivUrl: "https://arxiv.org/abs/2509.20928",
    doiUrl: "https://doi.org/10.48550/arXiv.2509.20928",
    pdfUrl: "/papers/CW_Gen_for_ProbTSF.pdf",
  },
];

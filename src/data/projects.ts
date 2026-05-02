export type Project = {
  title: string;
  description: string;
  tags: string[];
  githubUrl: string;
  demoUrl: string;
  coverImage: string;
};

export const projects: Project[] = [
  {
    // TODO: 替换为你的项目内容
    title: "AI 学习路线整理",
    description: "一个用于整理 AI 基础知识、论文阅读和实践资源的占位项目。",
    tags: ["AI", "Learning", "Markdown"],
    githubUrl: "https://github.com/your-username/ai-learning-roadmap",
    demoUrl: "",
    coverImage: "",
  },
  {
    // TODO: 替换为你的项目内容
    title: "RAG 实验 Demo",
    description: "围绕检索增强生成流程做的小型实验，包含索引、召回和回答生成。",
    tags: ["RAG", "LLM", "Python"],
    githubUrl: "https://github.com/your-username/rag-demo",
    demoUrl: "https://example.com",
    coverImage: "",
  },
  {
    // TODO: 替换为你的项目内容
    title: "个人知识库工具",
    description: "用于把学习记录、项目复盘和短笔记统一管理的工具原型。",
    tags: ["Notion", "Astro", "Automation"],
    githubUrl: "https://github.com/your-username/knowledge-base",
    demoUrl: "",
    coverImage: "",
  },
];

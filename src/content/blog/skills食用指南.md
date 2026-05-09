---
title: "Skills食用指南"
description: "skills是什么、怎么用，推荐和使用技巧"
pubDatetime: 2026-05-09T00:57:37.449Z
modDatetime: 2026-05-05T06:36:00.000Z
tags: ["使用教程"]
draft: false
---
> ### 💡 参考文献  
>   
> - Agent Skills官方文档：[https://agentskills.io/home](https://agentskills.io/home)  
>   
> - Claude Code官方文档：[https://code.claude.com/docs/zh-CN/skills](https://code.claude.com/docs/zh-CN/skills)  
>   
> - WaytoAGI社区分享：[https://waytoagi.feishu.cn/wiki/BBQtwTiOviUUXPku9SJcJvdmnZf](https://waytoagi.feishu.cn/wiki/BBQtwTiOviUUXPku9SJcJvdmnZf)  
>   
> - Codex高质量Skil合集：[https://github.com/ComposioHQ/awesome-codex-skills](https://github.com/ComposioHQ/awesome-codex-skills)


## 是什么


### 快速理解

> 文档导航：[搞懂 AI 那些名词，其实只需要一个框架](https://www.notion.so/356d4dcc3c4d808cb55bd76877cdd933) 

Skills的官方定义：Agent Skills 是模块化能力，用于扩展 Claude 的功能。每个 Skill 打包了 Claude 自动在相关时使用的指令、元数据和可选资源（脚本、模板）。


简单理解，Skills其实就是“可复用的SOP”，把一些可以沉淀为SOP的机械性工作打包成Skills作为说明书交给AI。但这件“固化重复性流程”的任务其实有很多种方式，比如写一个代码脚本、搭建一个workflow、甚至是提前准备一个标准prompt模版，那Skills真正独特的地方是什么？


个人认为是：**把人类的判断力和执行步骤，打包成 AI 可以理解和调用的上下文**。


这个任务的关键在于，是否能够处理模糊输入和理解语义，当任务满足以下两个条件时，skills是最佳选择：

- 输入是模糊的
- 执行需要判断

### 原理介绍

1. 形式

    ```plain text
    .claude/
    	|--- skills/
    			|--- my-skill/
    							|--- SKILL.md     # 必须：指令 + 元数据
    							|--- scripts/     # 可选：可执行代码
    											|--- deploy.sh
    											|--- validate.py
    							|--- references/  # 可选：参考文档
    										|--- REFERENCE.md
    							|--- assets/      # 可选：模版、资源
    										|--- config-template.json
    ```

2. 工作原理：

    渐进式披露（Progressive Disclosure），通过三阶段加载来高效管理上下文：


    | 阶段             | 加载时机     | 加载内容                         | 耗费token |
    | -------------- | -------- | ---------------------------- | ------- |
    | DIscovery发现阶段  | Agent启动时 | metadata（name + description） | ～100    |
    | Activation激活阶段 | Skill激活时 | skill.md完整文档                 | < 5000  |
    | Execution执行阶段  | 执行需要时    | scripts/assets/references    | 按需      |


    这个能力是Skills相较于MCP而言最大的优势：


    单个MCP Server一般就会包含大量工具，即使Agent能够知道要用哪个MCP，在加载的时候还是会消耗大量不必要的Token；


    而在真实环境下，Agent会连接非常多MCP Server，一方面造成大量token浪费，另一方面也造成模型的注意力下降，从而降低工具调用准确性。


    从这个角度看，其实Skills可以看作是原子化的MCP，或者说把MCP用一种漏斗的形式展现出来，从而解决token和注意力两方面的问题。

3. SKILL.md格式

    ```plain text
    ---
    name: my-skill-name          # 必填，小写+连字符，最多64字符
    description: |               # 必填，最多200字符，是触发机制的核心
      描述这个 Skill 做什么。
      Make sure to use this skill whenever the user mentions X or Y,
      even if they don't explicitly ask for it.
    dependencies:                # 可选，声明依赖
      - python3
      - node >= 18
    compatibility:               # 可选，声明兼容性要求
      - claude-code
    ---
    # My Skill 
    
    为Agent提供详细指令
    
    ## When to Use
    
    - 在以下情况使用此技能……
    - 在满足xxx情况时运行脚本：scripts/deploy.sh 
    
    ## Instructions
    
    - 为Agent提供分步指导
    - 最佳实践和模式
    - 特定领域的约定
    ```


## 怎么用

1. 安装skills
    1. 去哪里找到合适的skills？

        两个主流平台对比：skillsmap负责找、skills.sh负责装


        | **平台**                                | **定位**             | **核心优势**             |
        | ------------------------------------- | ------------------ | -------------------- |
        | [skillsmp.com](https://skillsmp.com/) | Agent Skills 市场    | 数量多 + AI 语义搜索 + 分类浏览 |
        | [skills.sh](https://skills.sh/)       | 开放 Agent Skills 生态 | 一键安装 + 排行榜 + 兼容性广    |


        | **维度**       | **skillsmap**                         | **skills.sh**                                |
        | ------------ | ------------------------------------- | -------------------------------------------- |
        | Skills 数量    | ~105k                                 | ~29k                                         |
        | 安装方式         | 手动克隆 + 复制                             | `npx skills add` 一键安装                        |
        | AI Agent 兼容性 | 主要 3 种（Claude Code、Codex CLI、ChatGPT） | 17+ 种（Cursor、Claude Code、Copilot、Windsurf 等） |
        | 搜索功能         | AI 语义搜索 + 关键词                         | 关键词搜索                                        |
        | 分类浏览         | 12 个分类                                | 无                                            |
        | 质量指标         | GitHub Star 数                         | 安装量数据                                        |
        | 排行榜          | 按时间/星标排序                              | All Time / Trending / Hot                    |
        | Skills 来源    | 社区广泛收录                                | 官方/知名团队为主                                    |

    2. 常用skills推荐

        基础集合式skills安装：

        - `anthropics/skills` — Anthropic 官方出品

            这是 Anthropic 的官方 Skill 仓库，主要包含的 Skills：

            - **skill-creator**：帮你创建自定义 Skill 的元技能
            - **frontend-design**：前端设计规范
            - **docx / pptx / xlsx / pdf**：Office 文档处理能力
        - `vercel-labs/agent-skills` — Vercel 官方出品

            专注于前端开发领域，主要包含：React 和 Next.js 性能优化指南（涵盖 40+ 条规则、8 个分类）、UI 代码审查（覆盖 100+ 条可访问性/性能/UX 规则）、React Native 最佳实践、View Transition API 动画实现、以及一键部署到 Vercel 的 deploy skill。

        - `obra/superpowers` — 社区明星项目

            这是生态内装机量第一的仓库，142,800+ 安装，给 Agent 赋予与网站交互的能力——导航页面、填写表单、点击按钮、提取数据、测试 Web 应用。


            ```shell
            npx --yes skills add anthropics/skills --all --global --yes
            npx --yes skills add vercel-labs/agent-skills --all --global --yes
            npx --yes skills add obra/superpowers --all --global --yes
            ```


        常用skills收录：


        | **Skill**                     | **适用场景**        |
        | ----------------------------- | --------------- |
        | ai-sdk                        | 构建 AI 应用、集成 LLM |
        | prompt-engineering-patterns   | Prompt 设计优化     |
        | mcp-builder                   | 构建 MCP 服务器      |
        | agent-browser                 | AI 浏览器自动化       |
        | find-skills                   | 发现和安装新 skills   |
        | web-design-guidelines         | 网页设计规范          |
        | social-content                | 社交媒体内容          |
        | writing-clearly-and-concisely | 更精炼的文风          |
        | crafting-effective-readmes    | README 编写       |
        | systematic-debugging          | 系统性问题排查         |
        | writing-plans                 | 项目计划编写          |
        | humanizer                     | 让 AI 文本更自然      |
        | professional-communication    | 职场沟通            |
        | data-storytelling             | 数据可视化叙事         |
        | File-organizer                | 整理电脑文件          |
        | Prompt-master                 | 万能提示词优化         |
        | Decision-toolkit              | 结构化决策工具         |
        | MCP-builder                   | 创建自己的MCP        |

    3. 怎样高效安装管理skills？
        1. 没事去耍耍skills.sh的Trending榜，看看最近流行什么
        2. 遇到新需求先去skillsmp.com搜索一下
        3. 安装前查看安装量，谨慎选择过于冷门的
        4. 隔段时间重跑安装命令，更新至最新版
2. 对话框输入/skill名称，或者在prompt中明确触发词

## 怎么写

1. Skill-Creator：用skill生产skill

    A社官方出品的用来生产skill的skill，用简单的语言表达希望做的事情，它能够完成SKILL.md初稿，并通过并行跑对比测试看skill效果如何

2. Fork改造：基于类似的skill改造成自己的
3. 手搓：先做后总结/直接发送SOP
    1. 基于对话记录总结：
        1. 给AI布置任务并进行多轮迭代优化，直到输出你满意的结果
        2. 一键固化保存成SKILL.md：

        ```markdown
        “现在请回复我们刚才所有的对话，把你的思考过程、我纠正你的规则、及最终的输出格式，反向提炼成一个Skill，且下次我只要输入类似内容，你就能直接按照这个标准完美输出”
        ```

    2. 给AI明确的SOP后让它生成：

        填写以下9个问题后发给AI：


        ```markdown
        1. 什么时候调用它？
        2. 核心任是什么？
        3. 用户要输入什么材料？
        4. 最终产物长什么样？
        5. 每一个执行步骤怎么操作？
        6. 判断标准是什么？
        7. 如何规避常见错误？
        8. 有哪些“Before/After”的参考？（成功的输入示例）
        9. 输出格式是什么？
        
        你是一个专业的skill工程师，请根据我提供的以上九个问题的答案，编写一个规范的SKILL.md文件，要求逻辑清晰，包含明确的执行步骤和限制条件
        ```


## 使用技巧


Skill自主进化器：让skill review skill


[link_preview](https://github.com/karpathy/autoresearch)

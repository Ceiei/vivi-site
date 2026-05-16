---
title: "搞懂 AI 那些名词，其实只需要一个框架"
description: "如何从「人类-Agent-模型」交互的角度理解各种AI名词"
pubDatetime: 2026-05-16T00:57:20.617Z
modDatetime: 2026-05-04T03:53:00.000Z
tags: ["思考和灵感"]
draft: false
---
每次看到 AI 相关的文章，总会冒出一堆让人头大的词：Prompt、MCP、RAG、Fine-tuning、Function Calling、Hooks……


这些词单个看还好，但堆在一起，脑子就开始打结。它们到底是什么关系？哪些是一类东西，哪些完全不相干？


我最近想通了一件事：**这些词之所以让人困惑，是因为我们没有一个合适的框架来安放它们。**


## 先从一个问题开始


你有没有想过，当你在用 ChatGPT 或者 Claude 的时候，整个系统里到底有几个"角色"在参与？


不是只有你和 AI 两个人。


仔细想想，其实有三个主体：


```plain text
人类  ←→  Agent（执行层）  ←→  模型（LLM）
```

- **人类**：就是你，提需求的那个人
- **Agent**：中间的执行层，负责理解你的意图、调用工具、编排流程
- **模型**：底层的大语言模型，负责理解和生成语言

这三个主体，两两之间都有交互。而几乎所有的 AI 名词，本质上都是在描述"某两个主体之间的交互方式"。（让Claude给画了个示意图）


![human_agent_model_interaction_map.svg](https://prod-files-secure.s3.us-west-2.amazonaws.com/dbed4dcc-3c4d-81fe-b5fb-0003f65da37d/2de0c2a7-f450-4662-808d-e7b2dd25dc58/human_agent_model_interaction_map.svg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4664FCP323U%2F20260516%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260516T005721Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjELn%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIQC%2Bk6dz72C8xGPqbcJHzyU11AYF1i1%2FMtO0F73nGULm4QIgKB9s%2BKiZnEo4Qu9ThKxA8%2F2vu3XhsBoviRYRLKEZTNUqiAQIgv%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgw2Mzc0MjMxODM4MDUiDK5puKQQt9RIRbitHyrcA1AtMSA8Nx%2Fny81oWJ6%2FXK%2BLVl6jf2r4X3DOGCmdoPtk4JN%2FlUyxkjF9w4x4z7BdxJyhUwUTc8%2BbNZKCfVv7yHbXAp5PWAis3ySu5uF5NEW%2B%2FkSccvjC6u0QI2Glku5UFlvRLwY2S3hGEytlyfQPy9rjIvfwdIThcx2y9SN7lrNwy%2Bwou6F9ys9elNq7xnikVFzQNVNiRjrhtVPmjlt7z6x1TDzGm%2FORfqSbAJX%2FPx3t70rsfvs%2FWVqWD3qGZyNCFF%2BrNOvVT4jueWQKAR0lKb23IWih6dOJOG2hxlXH7pAR%2BocEuhrjDL7vJy%2BfwtDA9m4mLEgHCuZAyGqBF2tWs5msLwSQ69scI5NVLDvnGNzE9Pcn7WD6X8tkNknOW6z2lp%2FLx83Vg%2B%2Bg9N3ZRDQeQDDdjPQlArlmCPy9myB7rpmuHZY5bS1Fr3jDhkaYMlwvbSBYmGLg7%2BOuqsxe0KHKzPvddfddTDlSxJmzUC5stsJSTFVd6bv07GmoxhyuaxkpZjXrklhod7WCvGAAiE6OfviP6UO%2FLoPntvQnC5oVPBohdp8Kp3zAJnlQkrZz2vr4SDI8N4QLYjZTZg88bcPpNlAe9fWy%2FovLHG4jyE%2Bd9xJZRALxU%2FnOxa6qjIAxMPf0ntAGOqUBA7Siask9hybSAFW7hfnrGzLVtKSjlQ0f%2BteCXNa0gzgx0ViUjCuMN254Wr3cNK1uLr2OUTuhyo4XRNkxAnj6nZ3l2uzoIMYPFOyzULKyZBZkdbF3nedaL6lij%2FJCzAIzDvKzAGiqiMlIafxXz96tY%2FpTCK1bTuHzjQxf1TRjw31TkCuUtcqpM%2BVj4HRq%2BUrG5C47874s9muoEm8n4QwA6wprWX1h&X-Amz-Signature=e217ce139fd9fdf9fca7a9af022523b725ca9f5058422ec59146bc671be07fe2&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)


**人类 ↔ Agent（绿色）**：Prompt、Workflow、Skills、Memory。这层的本质是人类表达意图，Agent 理解并执行。Skills 在这里的角色是"给 Agent 装上领域知识"，让人类不需要每次重复解释。


**Agent ↔ 模型（橙色）**：System Prompt、Context Window、Function Calling、Sampling Parameters。这层是 Agent 控制模型行为的接口——Agent 决定给模型看什么信息、用什么参数、允许调用哪些工具。


**人类 ↔ 模型（黄色，跨越 Agent）**：Harness Engineering、RLHF/Fine-tuning、Alignment、Eval。这层发生在训练和研究阶段，不是运行时。人类在这里直接塑造模型本身的价值观和能力，不经过 Agent 中间层。


**Agent ↔ 外部系统（蓝色）**：MCP、API、Hooks、RAG、Plugins。这层是 Agent 的"手"——用来操作外部世界。Hooks 比较特殊，它是 Agent 运行时的生命周期拦截点，本质上是 Agent 对自身执行过程的内部控制。


---


## 第一层：人类 ↔ Agent


这一层描述的是**你怎么跟 AI 系统说话**。


### Prompt：你说的那句话


Prompt 是最基础的概念，就是你输入的那段文字。"帮我写一封邮件"、"总结这篇文章"、"用 Python 写个排序算法"——这些都是 Prompt。


很多人以为 Prompt 就是"提示词"，觉得它是个技巧性的东西，像咒语一样，说对了 AI 就听话。


但本质上，Prompt 就是**人类向 Agent 发出的自然语言指令**。你说什么，Agent 就理解什么，没有什么玄学。


### Workflow：你设计的流水线


如果 Prompt 是"说一句话让 AI 做一件事"，那 Workflow 就是"设计一套流程，让 AI 按顺序做一系列事情"。


比如你想让 AI 帮你做竞品分析：先搜集资料、再整理对比、最后生成报告——这个流程就是一个 Workflow。


Workflow 是**人类对 Agent 执行逻辑的预先编排**。你不是在实时指挥，而是提前把"剧本"写好。


### Skills：你给 Agent 装的"专业知识包"


Skills 是个比较新的概念，官方的定义是：**动态加载的指令、脚本和资源文件夹，用于提升 Agent 在专项任务上的表现。**


但我觉得更直白的理解是：**你把某类任务的做法打包成一份"说明书"，Agent 在需要的时候自动拿来用。**


举个例子，你每次让 AI 生成 Word 文档，都要解释一遍"用什么库、什么格式、注意什么"——很烦对吧？有了 Skills，你只需要把这些写成一个 Skill 文件，之后 Agent 每次遇到相关任务，就自动加载这份说明书，不用你再重复解释。


Skills 的聪明之处在于：它不是死板的脚本，而是带有语义理解的知识包。你说"帮我整理成文档"、"导出报告"、"生成 Word"——无论怎么说，Agent 都能识别出这是要用 Word Skill。


### Memory：Agent 记住的事情


Memory 是 Agent 对过去交互的记忆。分两种：

- **短期记忆**：当前对话的上下文，聊完就忘
- **长期记忆**：跨会话保存的信息，比如"这个用户喜欢简洁的回答风格"

Memory 决定了 Agent 是"金鱼记忆"还是"有经验的老搭档"。


---


## 第二层：Agent ↔ 模型


这一层描述的是**Agent 怎么"操控"底层模型**。


很多人不知道，Agent 和模型之间是有一套精心设计的接口的。你以为 AI 就是一个整体，其实 Agent 在背后做了很多工作。


### System Prompt：Agent 给模型的"岗前培训"


你发给 AI 的 Prompt 叫 User Prompt，但在那之前，还有一个你通常看不到的东西：**System Prompt**。


System Prompt 是 Agent 在对话开始前就塞给模型的一段"内部指令"，用来设定角色和规则：

> "你是一个专业的法律助手，回答问题时要严谨，不能给出具体的法律建议，遇到不确定的情况要说明……"

你没看到这段话，但它一直在影响模型的行为。这就是为什么同一个模型，用在不同产品里，感觉完全不一样——因为 System Prompt 不同。


### Context Window：Agent 能往模型脑子里塞多少东西


模型每次处理信息，都有一个"工作记忆"的上限，叫 Context Window（上下文窗口）。


你们的聊天记录、上传的文件、搜索到的网页、工具返回的结果……Agent 需要把所有这些信息塞进 Context Window，再交给模型处理。


塞得越多，模型能参考的信息越丰富；但超过上限，就开始"忘事"了。


这就是为什么有时候对话聊太长，AI 会"失忆"——不是它不聪明，是 Context Window 满了。


### Function Calling：Agent 告诉模型"你可以用这些工具"


模型本来只会生成文字，但如果 Agent 告诉它"你有以下这些工具可以用"，模型就能在需要的时候调用它们。


比如 Agent 说："你有一个 `search_web` 工具，可以搜索互联网。"模型在回答时就可以决定："这个问题我需要搜一下"，然后触发搜索，拿到结果再回答。


Function Calling 是 Agent 给模型的"授权书"，决定了模型能做什么、不能做什么。


### Sampling Parameters：Agent 调的"性格旋钮"


temperature、top_p……这些词看起来很技术，但理解起来其实很直观：

- **temperature 高**：模型更"放飞自我"，答案更有创意，也更随机
- **temperature 低**：模型更"保守"，答案更确定，更少意外

Agent 通过调整这些参数，来控制模型输出的风格。写诗的时候 temperature 调高，做数学题的时候调低——这是 Agent 对模型"性格"的精细调节。


---


## 第三层：Agent ↔ 外部系统


这一层描述的是**Agent 怎么跟外部世界交互**，是 Agent 的"手脚"。


### API：Agent 调用外部能力的通道


API 是一个极其通用的概念——任何两个软件之间的"调用接口"都叫 API。Agent 调天气、调支付、调地图，用的都是 API。它只是一种通信规范，没有规定格式、没有统一标准，每家服务商定义自己的 API 长什么样。


### MCP：Agent 的"万能插头"


MCP 是一个专门为 AI Agent 设计的标准化协议，本质上也是 API 的一种，但它规定了一套所有人都遵守的统一格式——工具怎么声明、参数怎么传、结果怎么返回，全都标准化了。


没有 MCP 之前，每接入一个新服务，都要单独开发适配代码。有了 MCP，就像 USB 接口一样——只要遵循这个标准，任何工具都能即插即用。MCP 是 Agent 连接外部世界的**标准化接口协议**。


### Hooks：Agent 运行过程中的"拦截点"


Hooks 是在 Agent 执行流程的特定节点插入自定义逻辑的机制。


比如：

- Agent 写完代码后，自动触发格式化脚本（PostToolUse Hook）
- Agent 执行某个危险操作前，自动弹出确认（PreToolUse Hook）

Hooks 让你可以在 Agent 的运行过程中"插队"，加入自己的规则，而不需要修改 Agent 本身。


### RAG：给 Agent 装上"外挂知识库"


RAG（Retrieval-Augmented Generation，检索增强生成）是一种架构：Agent 在回答问题之前，先去知识库里检索相关内容，再把检索结果塞进 Context Window，交给模型生成答案。


解决的问题是：模型的训练数据有截止日期，而且容量有限。有了 RAG，你可以把公司内部文档、最新资讯、专业数据库……都变成 Agent 可以即时查询的知识来源。


---


## 第四层：人类 ↔ 模型（跨越 Agent）


这一层比较特殊——它不是运行时发生的交互，而是在**训练和研究阶段**，人类直接塑造模型本身。


### RLHF / Fine-tuning：把人类偏好"烧"进模型


RLHF（人类反馈强化学习）和 Fine-tuning（微调）都是训练方法，目的是让模型的行为更符合人类期望。


RLHF 的过程大致是：人类评估员对模型的输出打分，这些打分数据用来继续训练模型，让它学会"人类喜欢什么样的回答"。


这就是为什么 ChatGPT 发布后感觉比之前的模型"好说话"得多——因为它经过了大量人类反馈的训练。


### Alignment：让模型真正"听人话"


Alignment（对齐）听起来玄乎，其实目标很简单：**让模型的目标和行为与人类的价值观保持一致。**


一个没有对齐的模型，可能会用很聪明的方式做出有害的事。对齐研究就是在解决这个问题：怎么确保越来越聪明的 AI，始终在帮人类，而不是伤害人类。


### Harness Engineering：给模型"体检"的基础设施


Harness Engineering 是构建评测框架和测试基础设施的工程工作。


你想知道一个模型有多聪明、哪里有盲区、是否安全可靠——这些都需要系统性的测评。Harness Engineering 就是负责搭建这套"体检系统"的工程方向。


### Eval：模型的"成绩单"


Eval（评估）是对模型能力的系统性测量。数学能力、代码能力、推理能力、安全性……每个维度都有对应的 benchmark（基准测试）。


你经常看到的"在 X 测试上达到 Y 分"，就是 Eval 的结果。


---


## 最后说一句


虽然有了这个框架能够帮助我们快速理解不同名词所在的层级，但是实际情况是，三层的边界经常是模糊的甚至合并的：


**场景一：简单对话**


`人类 ↔ Claude.ai界面 ↔ Claude模型`


Agent 层很薄，基本只做消息传递，模型就是主要的"智能"所在。


**场景二：复杂 AI 系统**


`人类 ↔ Agent（有独立逻辑） ↔ 模型`


Agent 是真正独立的调度程序，会多轮调用模型、处理结果、决定下一步。


**场景三：模型即 Agent**


`人类 ↔ 模型（同时承担Agent职责）`


模型本身负责规划、调用工具、自我纠错——Claude Code 就是这样，既是 Agent 也是模型。


所以博文里这段框架，严格来说描述的是**一种理想化的分层模型**，现实中三层的边界经常是模糊的甚至合并的。

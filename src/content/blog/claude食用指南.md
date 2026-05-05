---
title: "Claude食用指南"
description: "Claude官方教程汉化版"
pubDatetime: 2026-05-05T00:56:32.786Z
modDatetime: 2026-05-04T04:40:00.000Z
tags: ["使用教程"]
draft: false
---
> 官方教程网址：[https://anthropic.skilljar.com/claude-101](https://anthropic.skilljar.com/claude-101)

# 使用常识


## 反封号

1. 区域｜时区｜语言调成新加坡
    - 修改时区：系统设置 - 通用 - 日期与时间
    - 选择新加坡：在距离最近的城市或时区搜索框中选择：Singapore- Singapore（新加坡也是东八区，没实质影响）
    - 修改地区：通用 - 语言与地区 将地区修改为：新加坡
2. 提前申请gmail/proton邮箱
    - proton邮箱：添加密保邮箱（常用邮箱）→ 对Claude（anthropic.com）及google官网（google.com)加白

## Token成本优化


使用/context命令可以查看各个模块的上下文使用量


### 对话管理

1. 频繁使用/clear，完成一个独立任务后立即清理前文开启新对话
2. 对话轮数达到5·6轮或上下文使用超过70%的时候，主动使用/compact压缩为摘要
3. 使用/mcp disable <server-name>关闭当前不需要的MCP服务器
4. 使用skill代替包含大量工具方法的MCP，充分利用skill按需加载的特性

### 上下文管理

1. 创建`.claudeignore`文件，阻止Claude读取相关文件

    ```shell
    # 依赖和包管理
    node_modules/
    .pnp/
    .yarn/
    
    # 构建产物
    dist/
    build/
    out/
    .next/
    .nuxt/
    
    # 环境变量和密钥（敏感文件用 deny 更保险）
    .env
    .env.*
    *.pem
    *.key
    
    # 日志和缓存
    *.log
    *.lock
    .cache/
    .parcel-cache/
    
    # 测试覆盖率
    coverage/
    .nyc_output/
    
    # Python
    __pycache__/
    *.pyc
    *.pyo
    .venv/
    venv/
    
    # IDE 配置
    .idea/
    .vscode/
    *.swp
    
    # 历史文档（不想影响当前编码上下文）
    docs/archive/
    CHANGELOG.md
    ```


    使用前安装相关工具：


    ```shell
    # 第一步：安装
    npm install -g claudeignore
    
    # 第二步：在项目根目录初始化（自动创建文件 + 写入 Hook）
    npx claude-ignore init
    
    # 第三步：编辑 .claudeignore，把你不想让 Claude 读的路径加进去
    # 之后正常启动 Claude Code 即可，Hook 自动生效
    ```

2. 精简claude.md
    - 控制在150-200行以内
    - 内容：项目概述、目录结构、关键命令、禁止读取的目录
    - 避免“探索性”读取：明确项目结构，减少Claude为理解项目自动执行的cat、find、grep的次数

# 常用命令


## /init命令


首次在项目中使用Claude Code时，建议运行/init命令，Claude会生成一个总结文档CLAUDE.md，该文件内容会被自动包含在每次请求中作为系统上下文。


## /compact命令


将当前对话压缩为摘要。


## 自定义命令


在`.claude/commands` 目录下创建markdown文件即可自定义命令，文件名就是命令名，例如创建audit.md，创建文件后重启CC，输入`/project:audit`执行。（本质上就是封装了一个可复用的prompt）


# 高级功能


## MCP

> 参考网址：[https://effloow.com/articles/top-mcp-servers-developer-guide-2026](https://effloow.com/articles/top-mcp-servers-developer-guide-2026)

**MCP（Model Context Protocol，模型上下文协议）** 是 Anthropic 推出的一个开放标准协议，用于让 Claude 与外部工具、数据源和服务进行连接与交互，本质上是给Cluade装上手，让它能够操作外部世界。


### 如何安装MCP


```shell
# 在本地安装
claude mcp add <name> -- npx -y @package/server
```


### 常用MCP介绍

1. **Playwright MCP**
    - **用途：**浏览器自动化，完成导航页面、点击元素、填写表单、截图并运行端到端测试。
    - **安装命令：**

        ```shell
        claude mcp add playwright -- npx @playwright/mcp@latest
        ```

    - **链接：**[https://github.com/microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp)
2. **Github MCP**
    - **用途：将**AI 助手连接到 GitHub API——管理仓库、创建和审核拉取请求、搜索代码、管理问题，并通过自然语言触发工作流程。
    - **安装命令：**

        ```shell
        # 用 
        GitHub 个人访问令牌
        替换 YOUR_GITHUB_PAT
        claude mcp add-json github '{"type":"http","url":"https://api.githubcopilot.com/mcp/","headers":{"Authorization":"Bearer YOUR_GITHUB_PAT"}}'
        ```

    - **链接：**[https://github.com/github/github-mcp-server](https://github.com/github/github-mcp-server)
3. **Git MCP**
    - **用途：** 本地 Git 仓库操作——提交历史、差异、分支管理和仓库分析。
    - **安装命令：**

        ```shell
        # 使用前需要先安装
        uv
        
        claude mcp add git --scope user -- uvx mcp-server-git
        ```

    - **链接：**[https://github.com/modelcontextprotocol/servers/tree/main/src/git](https://github.com/modelcontextprotocol/servers/tree/main/src/git)
4. **Filesystem MCP**
    - **用途：**赋予 Claude 受控的访问权限，可以在你明确允许的目录内读取、写入、搜索和管理文件。目录列表、文件创建、文件移动和内容搜索。
    - **安装命令：**

        ```shell
        # 路径参数（$（pwd） 或任意绝对路径）定义了服务器可以访问哪些目录。
        claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem $(pwd)
        ```

    - **链接：**[https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem)
5. **Context7 MCP**
    - **用途：** 查询时直接从库源获取最新的、版本特定的文档和代码示例。Context7 不再依赖几个月前的训练数据，而是在 Claude 需要时拉取当前文档。 这可以说是日常编码影响最大的 MCP 服务器。陈旧的文档是 AI 编码错误的最大来源，而 Context7 消除了这一点。
    - **安装命令：**

        ```shell
        claude mcp add context7 -- npx -y @upstash/context7-mcp@latest
        ```

    - **链接：**[https://www.npmjs.com/package/@upstash/context7-mcp](https://www.npmjs.com/package/@upstash/context7-mcp)
6. **Vectara MCP**
    - **用途：**基于用户提供的文档进行语义搜索和检索增强生成（RAG）。Vectara 会索引数据，并允许 Claude 通过自然语言查询搜索，返回经过事实核查的答案并附有来源引用。
    - **安装命令：**

        ```shell
        pip install vectara-mcp
        
        # 然后用 STDIO 传输配置 Claude Desktop 或 Claude 代码
        {
          "mcpServers": {
            "vectara": {
              "command": "python",
              "args": ["-m", "vectara_mcp"],
              "env": {
                "VECTARA_API_KEY": "your-api-key",
                "VECTARA_CORPUS_KEY": "your-corpus-key"
              }
            }
          }
        }
        ```

    - **链接：**[https://github.com/vectara/vectara-mcp](https://github.com/vectara/vectara-mcp)
7. **Zapier MCP**
    - **用途：**将 Claude 连接到 Zapier 近 8000 个应用生态系统——Google Sheets、Slack、Jira、HubSpot 及其他应用，AI 助手可以触发工作流程，读取连接应用的数据，并自动化跨工具操作。
    - **安装命令：**通过Zapier仪表盘设置
        - 进入 [**zapier.com/mcp**](https://zapier.com/mcp) 并创建一个新的 MCP 服务器
        - 选择 Claude 作为你的 MCP 客户端
        - 添加你想让 Claude 访问的工具（应用）
        - 复制服务器网址并添加到 Claude 代码中：

            ```shell
            claude mcp add --transport http zapier https://actions.zapier.com/mcp/YOUR_SERVER_ID/sse
            ```

    - **链接：**[**help.zapier.com/mcp**](https://help.zapier.com/hc/en-us/articles/36265392843917-Use-Zapier-MCP-with-your-client)
8. **Notion MCP**
    - **用途：**阅读和写入 Notion 页面，查询数据库，跨工作区搜索，并直接从 Claude 管理内容。
    - **安装命令：**

        ```shell
        claude mcp add --transport http notion https://mcp.notion.com/mcp
        ```

    - **链接：**[https://developers.notion.com/guides/mcp/get-started-with-mcp](https://developers.notion.com/guides/mcp/get-started-with-mcp)
9. **Memory MCP**
    - **用途：**为 Claude 提供持久内存，使用存储为 JSON 文件的本地知识图谱。Claude 可以记住跨会话的实体、关系和观察——项目决策、架构选择、你的偏好、团队惯例。
    - **安装命令：**

        ```shell
        claude mcp add memory -- npx -y @modelcontextprotocol/server-memory
        
        # 指定自定义存储位置
        claude mcp add memory -e MEMORY_FILE_PATH=~/.claude/memory.json -- npx -y @modelcontextprotocol/server-memory
        ```

    - **链接：**[https://www.npmjs.com/package/@modelcontextprotocol/server-memory](https://www.npmjs.com/package/@modelcontextprotocol/server-memory)
10. **Firecrawl MCP**
    - **用途：**网页爬虫和爬取，将网页转换为干净的 Markdown。抓取 URL、搜索网页、映射整个域名以便发现 URL、用模式提取结构化数据，并运行批处理操作。
    - **安装命令：**

        ```shell
        # 在 https://firecrawl.dev/app/api-keys 获取 API 密钥。免费套餐包含 500 积分。
        claude mcp add firecrawl -e FIRECRAWL_API_KEY=your-api-key -- npx -y firecrawl-mcp
        ```

    - **链接：**[https://github.com/firecrawl/firecrawl-mcp-server](https://github.com/firecrawl/firecrawl-mcp-server)

### 在哪里找MCP

- [https://mcpmarket.com/zh](https://mcpmarket.com/zh)
- [https://mcpservers.org/](https://mcpservers.org/)

## Hooks钩子


Hook 字面意思是"钩子"——核心思想是：在某个流程的特定节点，插入自定义逻辑，例如：自动格式化代码、编辑后运行测试、组织Claude读取特定文件等。


Claude配置文件中hooks的配置分为两部分：pre-tool use和post-tool use，每部分包含matcher（匹配的工具类型）和command（需要执行的命令）：

- pre-tool use hook：检查Claude的意图并阻止操作
- post-tool use hook：工具已执行，做后续操作并反馈给Claude

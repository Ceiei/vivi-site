---
title: "Agent速通——从理论到实践"
description: "ground to truth的实战文章！揭开agent的神秘面纱"
pubDatetime: 2026-07-25T07:58:00.000Z
modDatetime: 2026-07-29T02:40:00.000Z
tags: ["最佳实践"]
draft: false
---
# 1 理论篇


## 1.1 理论基础


ReAct框架：[https://arxiv.org/abs/2210.03629](https://arxiv.org/abs/2210.03629)


ReAct智能体核心是**将推理与执行结合起来**，它的运作基于一个循环过程（不断迭代更新），包括以下三个步骤：

- 推理（Reasoning）：依赖LLM作为大脑，分析当前任务状态，生产内部推理，决定下一步行动，核心思想是CoT（Chain of Thought）
- 执行（Acting）：根据上一步的推理结果，执行具体的操作，例如查询信息或调用外部工具（Function Tool，MCP， Shell命令，代码执行等）
- 观察（Observation）：观察行动的结果，将反馈用于下一轮的思考；或者观察到已经判断是最终的答案，则整理输出结果

## 1.2 框架核心


所有Agent框架在工程实现上都可以拆分为以下三部分：

- LLM Call：这部分为**LLM API管理**的范畴，通常情况下，主要工作是兼容各大LLM厂商的API实现细节以及流式输出等基础能力，为Agent框架提供一个标准化的API调用。
- Tools Call：这部分主要是LLM如何**使用外部工具**，从最早的Function Call到后来的MCP以及当前的Skill部分内容（涉及工具调用的那部分）都属于这一范畴。当前Tools的主流形式包括文件操作、网络搜索、Shell命令/代码执行以及API/MCP调用等，根据Agent具体使用场景而定，也可以后续增删改。
- Context Engineering：狭义的上下文工程特指**提示词Prompt的工程实现**（如Rules、Claude.md以及AGENTS.md等），而广义上的上下文工程其实也包含LLM使用外部工具这部分（比如Skills，它是工具与提示词结合的典范）。

以上三部分中，最大的变量是第三部分——上下文工程，也是Agent框架的核心所在。从[Manus的实践经验](https://manus.im/zh-cn/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus)来看，目前Agent工程的两大业内共识：

- 使用文件系统作为上下文：将大量零碎文件放到固定目录的文件夹中，从而实现按需读取和保存长期记忆
- 编程是解决通用问题的普适方法：AI更擅长使用代码解决问题

上下文工程的核心引擎：Agent Loop，本质是一个While循环，每一次迭代是一次LLM推理外加工具调用和上下文处理，典型的工作流程：


```markdown
初始上下文（系统提示词+用户请求）
    ↓
[agent loop开始]
    ↓
agent读取上下文 → 思考 → 决定行动
    ↓
执行工具/行动 → 获得结果
    ↓
结果追加到上下文
    ↓
[loop继续或结束]
```


一句话总结：**Agent框架设计的核心就是在Agent Loop这个While循环中设计如何管理上下文**。


# 2 实践篇——Coding Copilot Agent 设计与实现


## 2.1 整体架构


## 2.2 框架三要素设计


### 2.2.1 LLM Call


本项目采用极简设计，以 DeepSeek 模型为例：

- **LLM Provider**：使用 DeepSeek 提供的 `deepseek-chat` 模型。
- **LLM Call API**：使用标准化的 OpenAI Python SDK。DeepSeek API 兼容 OpenAI SDK 的调用格式，因此只需要配置对应的 `api_key`、`base_url` 和模型名称。
- **调用方式**：为保证代码的最大可读性，本项目采用同步、非流式调用。程序会等待模型完整返回一次结果后，再解析模型决策并进入下一步工具调用。
- **输入形式**：使用标准的 `messages` 消息列表，将 System Prompt、用户请求、历史行动和工具执行结果共同传递给模型。模型输入示例：

```python
messages = [
    {
        "role": "system",
        "content": SYSTEM_PROMPT,
    },
    {
        "role": "user",
        "content": user_request,
    },
]
```

- **输出形式**：要求模型返回结构化 JSON，模型输出只允许包含以下两种动作：明确表示下一步是调用工具还是输出最终答案。

```python
调用工具：

{
  "type": "tool",
  "tool_name": "read_file",
  "arguments": {
    "path": "workspace/solution.py"
  },
  "reason": "需要读取用户代码后进行审查"
}

输出最终答案：

{
  "type": "final",
  "answer": "代码审查、修正结果和错误复盘"
}
```


### 2.2.2 Tools Call


采用极简的工具集，操作对象包含文件、Shell和Python代码执行


1）Tools 实现：总共支持4个工具函数

- shell_exec：执行shell命令并返回输出
- file_read：读取文件内容
- file_write：写入文件内容（自动创建目录）
- python_exec：在子进程中执行Python代码并返回输出

2）Tools 注册：这里选择的是手动维护字典映射的方式 name → (function, OpenAI function schema) ，这一步是为了解析llm call 的response时可以根据name匹配需要具体执行哪个tool


Tools 的定义遵循的是 OpenAI Function Calling 的标准格式（也称 OpenAI Tools API schema）


### 2.2.3 Context Engineering

- System Prompt：极简系统提示词，告知LLM可用工具和ReAct思考方式
- 用户Session管理：使用messages 列表方式（OpenAI chat 格式），它是核心状态，累积系统提示词、用户消息、助手响应和工具结果

## 2.3 代码实现


### 2.3.1 第一部分：Agent Loop与上下文

- 基础流程： LLM call → parse tool_calls → execute → append results to messages → loop or exit
- 使用全局变量message作为上下文的载体，累积系统提示词、用户消息、助手响应和工具结果
- 其中，变量message按如下规则更新
    - 使用System Prompt初始化：{"role": "system", "content": system_prompt}
    - 追增User Message：{"role": "user", "content": user_message}
    - 追加Tool Results：{"role": "tool", "content": result}
<details>
<summary>agent_loop代码实现：</summary>

```python
import json
import os
import subprocess
import sys
import tempfile

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None  # type: ignore[assignment]

# ============================================================
# Agent Loop — 核心
# ============================================================
MAX_TURNS = 20
def agent_loop(user_message: str, messages: list, client: OpenAI) -> str:
    """
    Agent Loop：while 循环驱动 LLM 推理与工具调用。
    流程：
      1. 将用户消息追加到 messages
      2. 调用 LLM
      3. 若 LLM 返回 tool_calls → 逐个执行 → 结果追加到 messages → 继续循环
      4. 若 LLM 直接返回文本（无 tool_calls）→ 退出循环，返回文本
      5. 安全上限 MAX_TURNS 轮
    """
    # 追加用户消息
    messages.append({"role": "user", "content": user_message})
    # 提取工具描述
    tool_schemas = [t["schema"] for t in TOOLS.values()]
    # 进入Agent Loop
    for turn in range(1, MAX_TURNS + 1):
        # --- LLM Call调用LLM ---
        response = client.chat.completions.create(
            model="deepseek-v4-flash", # 这里可以换成别的模型名称
            messages=messages,
            tools=tool_schemas,
        )
        choice = response.choices[0]
        assistant_msg = choice.message
        # 将 assistant 消息追加到上下文
        messages.append(assistant_msg.model_dump())
        # --- 终止条件：无 tool_calls ---
        if not assistant_msg.tool_calls:
            return assistant_msg.content or ""
        # --- 执行每个 tool_call ---
        for tool_call in assistant_msg.tool_calls:
            name = tool_call.function.name
            raw_args = tool_call.function.arguments
            print(f"  [tool] {name}({raw_args})")
            # 解析参数并调用工具
            try:
                args = json.loads(raw_args)
            except json.JSONDecodeError:
                args = {}
            tool_entry = TOOLS.get(name)
            if tool_entry is None:
                result = f"[error] unknown tool: {name}"
            else:
                result = tool_entry["function"](**args)
            # 将工具结果追加到上下文
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": result,
                }
            )
    return "[agent] reached maximum turns, stopping."
```


</details>


### 2.3.2 第二部分：Tools实现与注册

<details>
<summary>实现四个工具函数：shell_exec, file_read, file_write, python_exec</summary>

```python
# ============================================================
# Tools 实现 — 4 个工具函数
# ============================================================
def shell_exec(command: str) -> str:
    """执行 shell 命令并返回 stdout + stderr。"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=30,
        )
        output = result.stdout
        if result.stderr:
            output += "\n[stderr]\n" + result.stderr
        if result.returncode != 0:
            output += f"\n[exit code: {result.returncode}]"
        return output.strip() or "(no output)"
    except subprocess.TimeoutExpired:
        return "[error] command timed out after 30s"
    except Exception as e:
        return f"[error] {e}"
def file_read(path: str) -> str:
    """读取文件内容。"""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        return f"[error] {e}"
def file_write(path: str, content: str) -> str:
    """将内容写入文件（自动创建父目录）。"""
    try:
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        return f"OK — wrote {len(content)} chars to {path}"
    except Exception as e:
        return f"[error] {e}"
def python_exec(code: str) -> str:
    """在子进程中执行 Python 代码并返回输出。"""
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".py", delete=False, encoding="utf-8"
        ) as tmp:
            tmp.write(code)
            tmp_path = tmp.name
        result = subprocess.run(
            [sys.executable, tmp_path],
            capture_output=True,
            text=True,
            timeout=30,
        )
        output = result.stdout
        if result.stderr:
            output += "\n[stderr]\n" + result.stderr
        return output.strip() or "(no output)"
    except subprocess.TimeoutExpired:
        return "[error] execution timed out after 30s"
    except Exception as e:
        return f"[error] {e}"
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
```


</details>

<details>
<summary>定义好Tools后再进行字典映射，方便Agent知道调用什么工具：</summary>

```python
# ============================================================
# Tools 注册 — name → (function, OpenAI function schema)
# ============================================================
TOOLS = {
    "shell_exec": {
        "function": shell_exec,
        "schema": {
            "type": "function",
            "function": {
                "name": "shell_exec",
                "description": "Execute a shell command and return its output.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "command": {
                            "type": "string",
                            "description": "The shell command to execute.",
                        }
                    },
                    "required": ["command"],
                },
            },
        },
    },
    "file_read": {
        "function": file_read,
        "schema": {
            "type": "function",
            "function": {
                "name": "file_read",
                "description": "Read the contents of a file at the given path.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Absolute or relative file path.",
                        }
                    },
                    "required": ["path"],
                },
            },
        },
    },
    "file_write": {
        "function": file_write,
        "schema": {
            "type": "function",
            "function": {
                "name": "file_write",
                "description": "Write content to a file (creates parent directories if needed).",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Absolute or relative file path.",
                        },
                        "content": {
                            "type": "string",
                            "description": "Content to write.",
                        },
                    },
                    "required": ["path", "content"],
                },
            },
        },
    },
    "python_exec": {
        "function": python_exec,
        "schema": {
            "type": "function",
            "function": {
                "name": "python_exec",
                "description": "Execute Python code in a subprocess and return its output.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "code": {
                            "type": "string",
                            "description": "Python source code to execute.",
                        }
                    },
                    "required": ["code"],
                },
            },
        },
    },
}
```

> 这里每个工具的schema字段的结构遵循OpenAI Function Calling 的标准格式：
>
> ```python
> {
>       "type": "function",
>       "function": {
>           "name": "...",
>           "description": "...",
>           "parameters": {
>               "type": "object",
>               "properties": { ... },
>               "required": [ ... ],
>           },
>       },
>   }
> ```
>
>

</details>


### 2.3.3 第三部分：System Prompt

<details>
<summary>定义system prompt，告诉Agent它是什么，可以使用什么工具</summary>

```python
# ============================================================
# System Prompt
# ============================================================
SYSTEM_PROMPT = """You are a helpful AI assistant with access to the following tools:
1. shell_exec — run shell commands
2. file_read — read file contents
3. file_write — write content to a file
4. python_exec — execute Python code
Think step by step. Use tools when you need to interact with the file system, \
run commands, or execute code. When the task is complete, respond directly \
without calling any tool."""
```


</details>


至此一个极简的Agent框架就此实现完成，单文件搞定，全部代码279行。


### 2.3.4 第四部分：终端交互入口


框架实现完成之后，距离Agent应用就剩下最后一个用户交互界面了。

<details>
<summary>从极简思想出发，这里使用Python的交互式命令行作为Agent的入口：</summary>

```python
def main():
    api_key = os.environ.get("DEEPSEEK_API_KEY")
    if not api_key:
        print("Error: please set DEEPSEEK_API_KEY environment variable.")
        sys.exit(1)
    client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")
    messages: list = [{"role": "system", "content": SYSTEM_PROMPT}]
    print("Agent ready. Type your message (or 'exit' to quit, 'clear' to reset).\n")
    # 进入对话循环
    while True:
        try:
            user_input = input("You> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nBye.")
            break
        if not user_input:
            continue
        # 输入exit退出
        if user_input.lower() == "exit":
            print("Bye.")
            break
        # 输入clear清空上下文
        if user_input.lower() == "clear":
            messages.clear()
            messages.append({"role": "system", "content": SYSTEM_PROMPT})
            print("(context cleared)\n")
            continue
        # 调用agent
        reply = agent_loop(user_input, messages, client)
        print(f"\nAgent> {reply}\n")
        
if __name__ == "__main__":
    main()
```


</details>


## 2.4 使用指南


### 2.4.1 获取API Key


由于本文Agent框架的LLM Provider是基于DeepSeek实现的，所以需要获取DeepSeek模型（deepseek-chat模型）的API key才能使用。

- 注册：[ https://platform.deepseek.com](https://platform.deepseek.com/)
- 获取API Keys：[ https://platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
- 往里面充钱
<details>
<summary>终端设置API Key：</summary>

```python
export DEEPSEEK_API_KEY="sk-xxxxx"
```


</details>


### 2.4.2 运行agent.py


终端输入命令激活agent：


```python
python agent.py
```


### 2.4.3 在终端对话


![image.png](/vivi-site/notion-assets/agent%E9%80%9F%E9%80%9A-%E4%BB%8E%E7%90%86%E8%AE%BA%E5%88%B0%E5%AE%9E%E8%B7%B5/ce67fd62db736ca1.png)


（虽然我这里配置的是Deepseek的API Key，但是agent还是宣称自己是Claude，捕获一名叛徒x


# 3 总结和拓展


可以看到实现的Agent应用，虽然实现极简，但是功能可以一点不简单（当Agent拥有文件读写权限，外加Shell工具以及代码生成与执行权限，它在本机上真的可以**"为所欲为"**)。要知道OpenClaw的[底层Agent Core（Pi Agent）](https://lucumr.pocoo.org/2026/1/31/pi/)的Tools层也是有且仅包含四个工具方法：读文件（Read）、写文件（Write）、编辑文件（Edit）、命令行（Shell），其他的丰富且强大能力均靠事件机制及Skills扩展而来。


目前实现的是非常极简版本的单个代码文件定义agent，代码库本质上也是上下文工程的一部分，代码库越简单上下文越清晰（信息噪声越少），Agent则越智能。当然对于功能更复杂的agent，还需要更多的上下文设计来给它赋能。

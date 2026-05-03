# Your Name

## Quick Start

如果你只是想快速记住“本地修改到推送上线”的流程，按下面这套 SOP 走就行：

1. 切到要修改的分支，或者新建一个功能分支。
2. 在本地修改文件，改完后先预览或检查效果。
3. 运行构建确认没有报错。
4. 查看 Git 状态，把需要提交的文件暂存并提交。
5. 推送到远端分支。
6. 如果这个仓库的线上站点只部署 main，就把功能分支合并进 main，再推送 main。

常用命令如下：

```bash
git checkout -b your-feature-branch
npm install
npm run dev
npm run build
git status
git add .
git commit -m "your message"
git push origin your-feature-branch
```

如果需要让 GitHub Pages 更新，最后还要把分支合并到 main 并推送 main：

```bash
git checkout main
git merge your-feature-branch
git push origin main
```

如果出现冲突，先在本地解决冲突，再重新执行 build 和 push。

这是一个基于 AstroPaper 的个人网站，包含关于我、AI 学习笔记、项目展示和碎碎念四个模块。AI 学习笔记支持把 Notion Database 中已发布的页面同步为 Markdown，并通过 GitHub Actions 自动部署到 GitHub Pages。

## 本地运行

```bash
npm install
npm run dev
```

常用命令：

```bash
npm run build        # 类型检查并构建静态站点
npm run preview      # 本地预览 dist 构建结果
npm run notion:sync  # 从 Notion 同步文章
```

本地测试 Notion 同步前，需要设置环境变量：

```bash
export NOTION_TOKEN="你的 Notion integration token"
export NOTION_DATABASE_ID="你的 Notion database id"
npm run notion:sync
```

同步后的 Markdown 会输出到 `src/content/blog/`。

## 四个模块如何修改

### 关于我

页面文件：`src/pages/about.astro`

可以修改的内容：

- 网站显示名称：修改 `src/config.ts` 里的 `SITE.title`。
- 头像：把头像图片放到 `src/assets/avatar.jpg`，然后在 `src/pages/about.astro` 中把头像占位区替换成图片。
- 个人介绍：搜索 `// TODO: 替换为你的个人介绍`，替换下面的占位文案。
- 技能标签：修改 `skills` 数组。
- 联系方式：修改 `contacts` 数组里的 GitHub 和 Email 链接。

### AI 学习笔记

列表页和详情页：

- `src/pages/blog/[...page].astro`
- `src/pages/blog/[...slug]/index.astro`

文章内容目录：`src/content/blog/`

手动新增文章时，在 `src/content/blog/` 下创建 `.md` 文件，并使用下面的 frontmatter：

```yaml
---
title: "文章标题"
description: "一句话摘要"
pubDatetime: 2026-05-02T00:00:00.000Z
tags: ["AI", "学习笔记"]
draft: false
---
```

Notion 自动同步也会写入这个目录。文章 URL 会是 `/blog/文件名/`，标签筛选页面仍然是 `/tags/标签名/`。

### 项目展示

页面文件：`src/pages/projects.astro`

项目数据文件：`src/data/projects.ts`

新增或修改项目时，编辑 `projects` 数组：

```ts
{
  title: "项目名称",
  description: "项目描述",
  tags: ["Astro", "AI"],
  githubUrl: "https://github.com/your-username/project",
  demoUrl: "https://example.com",
  coverImage: "",
}
```

`demoUrl` 为空时页面会自动隐藏 Demo 链接。`coverImage` 可填 `/images/example.png` 这类 public 目录路径，或留空不显示封面。

### 碎碎念

页面文件：`src/pages/notes.astro`

内容目录：`src/content/notes/`

每条碎碎念是一个独立 Markdown 文件，不需要标题。新增时创建一个 `.md` 文件：

```yaml
---
date: 2026-05-02T09:00:00.000Z
mood: "💡"
---
这里写正文内容。
```

页面会按 `date` 倒序展示。`mood` 可删除或留空。

## 如何增加新的模块

新增模块通常需要改 3 个地方：

1. 新增页面文件

在 `src/pages/` 下创建页面。例如新增 `/reading`：

```text
src/pages/reading.astro
```

页面可以参考 `src/pages/projects.astro` 或 `src/pages/notes.astro` 的结构，继续使用 `Layout`、`Header`、`Footer` 和 Tailwind class。

2. 更新导航栏

编辑 `src/components/Header.astro`，在导航列表中新增链接：

```astro
<li class="col-span-2">
  <a href="/reading" class:list={{ "active-nav": isActive("/reading") }}>
    阅读
  </a>
</li>
```

3. 更新首页入口

编辑 `src/pages/index.astro` 里的 `modules` 数组，增加一个入口卡片：

```ts
{
  title: "阅读",
  href: "/reading",
  description: "这里放阅读记录和书摘。",
}
```

如果新模块需要 Markdown 内容，还需要在 `src/content.config.ts` 里新增一个 collection，并在 `src/content/模块名/` 下放 Markdown 文件。可以参考 `notes` collection 的写法。

## GitHub Pages 配置

1. 把项目推送到 GitHub，并确保默认分支是 `main`。
2. 打开仓库 `Settings -> Pages`。
3. 在 `Build and deployment` 中选择 `Source: GitHub Actions`。
4. 修改 `src/config.ts` 里的 `SITE.website` 为你的 Pages 地址。
   - 用户主页仓库通常是 `https://你的用户名.github.io/`
   - 普通项目仓库通常是 `https://你的用户名.github.io/仓库名/`
5. push 到 `main` 后，`.github/workflows/deploy.yml` 会自动构建并部署。

## GitHub Secrets 配置

进入仓库 `Settings -> Secrets and variables -> Actions -> New repository secret`，添加：

- `NOTION_TOKEN`：Notion Integration 的 Secret。
- `NOTION_DATABASE_ID`：Notion Database ID。
- `NOTION_DATA_SOURCE_ID`：可选。新版 Notion API 使用 data source 查询；脚本会优先自动从 database 解析 data source id。只有自动解析失败时才需要手动添加这个 Secret。

`.github/workflows/notion-sync.yml` 会在北京时间每天 08:00 自动运行，也可以在 Actions 页面手动触发。

## Notion Database 字段

推荐使用下面这些字段名，脚本会优先识别它们：

| 字段名                  | 类型         | 说明                                          |
| ----------------------- | ------------ | --------------------------------------------- |
| `Title` 或 `Name`       | Title        | 文章标题                                      |
| `Description`           | Rich text    | 文章摘要，会写入 frontmatter 的 `description` |
| `Published`             | Checkbox     | 勾选后才会同步                                |
| `PubDatetime` 或 `Date` | Date         | 发布日期，会写入 `pubDatetime`                |
| `ModDatetime`           | Date         | 可选，上次更新时间，会写入 `modDatetime`      |
| `Tags`                  | Multi-select | 文章标签                                      |
| `Slug`                  | Rich text    | 可选，自定义文章文件名和 URL slug             |

脚本也兼容中文字段名：`标题`、`摘要`、`已发布`、`发布日期`、`更新时间`、`标签`、`路径`。

每篇同步文章会生成以下 frontmatter：

```yaml
---
title: "文章标题"
description: "文章摘要"
pubDatetime: 2026-05-02T00:00:00.000Z
modDatetime: 2026-05-03T00:00:00.000Z
tags: ["AI", "学习笔记"]
draft: false
---
```

## 目录说明

- `src/config.ts`：站点名称、作者、SEO 描述、GitHub Pages 地址。
- `src/pages/about.astro`：关于我页面，包含头像占位、技能标签和联系方式。
- `src/pages/blog/`：AI 学习笔记列表和文章详情页。
- `src/pages/projects.astro`：项目展示页面。
- `src/pages/notes.astro`：碎碎念时间轴/瀑布流页面。
- `src/data/projects.ts`：项目展示数据。
- `src/content/blog/`：博客文章 Markdown，Notion 同步输出目录。
- `src/content/notes/`：碎碎念 Markdown 内容目录。
- `scripts/notion-sync.js`：Notion Database 到 Markdown 的同步脚本。
- `.github/workflows/deploy.yml`：push 到 `main` 后部署 GitHub Pages。
- `.github/workflows/notion-sync.yml`：每天定时同步 Notion 并部署。

import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import fs from "node:fs/promises";
import path from "node:path";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");
const MANIFEST_FILE = path.join(BLOG_DIR, ".notion-sync-manifest.json");

const notionToken = process.env.NOTION_TOKEN;
const databaseId = process.env.NOTION_DATABASE_ID;
const configuredDataSourceId = process.env.NOTION_DATA_SOURCE_ID;

if (!notionToken || !databaseId) {
  throw new Error(
    "Missing NOTION_TOKEN or NOTION_DATABASE_ID. Please set both environment variables."
  );
}

const notion = new Client({
  auth: notionToken,
  notionVersion: "2025-09-03",
});
const n2m = new NotionToMarkdown({ notionClient: notion });

const PROPERTY_ALIASES = {
  title: ["Title", "Name", "标题", "名称"],
  description: ["Description", "Summary", "Excerpt", "摘要", "简介"],
  published: ["Published", "Publish", "已发布", "发布"],
  status: ["Status", "状态"],
  pubDatetime: ["PubDatetime", "Published At", "Date", "发布日期", "发布时间"],
  tags: ["Tags", "Tag", "标签", "分类"],
  slug: ["Slug", "URL Slug", "路径"],
};

function getProperty(properties, aliases) {
  for (const name of aliases) {
    if (properties[name]) return properties[name];
  }
  return undefined;
}

function plainText(richText = []) {
  return richText.map(item => item.plain_text ?? "").join("").trim();
}

function readTitle(properties) {
  const property = getProperty(properties, PROPERTY_ALIASES.title);
  if (!property) return "Untitled";
  if (property.type === "title") return plainText(property.title);
  if (property.type === "rich_text") return plainText(property.rich_text);
  return "Untitled";
}

function readText(properties, aliases, fallback = "") {
  const property = getProperty(properties, aliases);
  if (!property) return fallback;

  if (property.type === "rich_text") return plainText(property.rich_text);
  if (property.type === "title") return plainText(property.title);
  if (property.type === "url") return property.url ?? fallback;
  if (property.type === "select") return property.select?.name ?? fallback;
  return fallback;
}

function readDate(properties) {
  const property = getProperty(properties, PROPERTY_ALIASES.pubDatetime);
  if (property?.type === "date" && property.date?.start) {
    return new Date(property.date.start).toISOString();
  }
  return new Date().toISOString();
}

function readTags(properties) {
  const property = getProperty(properties, PROPERTY_ALIASES.tags);
  if (!property) return ["AI"];

  if (property.type === "multi_select") {
    return property.multi_select.map(tag => tag.name).filter(Boolean);
  }
  if (property.type === "select" && property.select?.name) {
    return [property.select.name];
  }
  if (property.type === "rich_text") {
    return plainText(property.rich_text)
      .split(",")
      .map(tag => tag.trim())
      .filter(Boolean);
  }
  return ["AI"];
}

function isPublished(properties) {
  const published = getProperty(properties, PROPERTY_ALIASES.published);
  if (published?.type === "checkbox") return published.checkbox;
  if (published?.type === "select") return published.select?.name === "Published";
  if (published?.type === "status") return published.status?.name === "Published";

  const status = getProperty(properties, PROPERTY_ALIASES.status);
  const statusName =
    status?.type === "status" ? status.status?.name : status?.select?.name;

  return ["Published", "已发布", "发布"].includes(statusName ?? "");
}

function slugify(input, fallback) {
  const slug = input
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback.replace(/-/g, "");
}

function yamlString(value) {
  return JSON.stringify(value ?? "");
}

function yamlArray(values) {
  return `[${values.map(value => yamlString(value)).join(", ")}]`;
}

function toFrontmatter({ title, description, pubDatetime, tags }) {
  return [
    "---",
    `title: ${yamlString(title)}`,
    `description: ${yamlString(description)}`,
    `pubDatetime: ${pubDatetime}`,
    `tags: ${yamlArray(tags)}`,
    "draft: false",
    "---",
    "",
  ].join("\n");
}

async function queryAllPages() {
  const pages = [];
  let cursor;
  const dataSourceId = await resolveDataSourceId();

  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
      page_size: 100,
    });

    pages.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return pages;
}

async function resolveDataSourceId() {
  if (configuredDataSourceId) return configuredDataSourceId;

  try {
    const database = await notion.databases.retrieve({
      database_id: databaseId,
    });
    const dataSource = database.data_sources?.[0];

    if (dataSource?.id) return dataSource.id;
  } catch (error) {
    process.stderr.write(
      `Could not retrieve database metadata. Treating NOTION_DATABASE_ID as a data source id.\n${error.message ?? error}\n`
    );
  }

  return databaseId;
}

async function readManifest() {
  try {
    return JSON.parse(await fs.readFile(MANIFEST_FILE, "utf8"));
  } catch {
    return { files: [] };
  }
}

async function removePreviouslySyncedFiles() {
  const manifest = await readManifest();
  await Promise.all(
    (manifest.files ?? []).map(async file => {
      try {
        await fs.unlink(path.join(BLOG_DIR, file));
      } catch {
        // The file may have been deleted manually; keep the sync idempotent.
      }
    })
  );
}

async function pageToMarkdown(page) {
  const properties = page.properties ?? {};
  const title = readTitle(properties);
  const description = readText(
    properties,
    PROPERTY_ALIASES.description,
    "AI 学习笔记"
  );
  const pubDatetime = readDate(properties);
  const tags = readTags(properties);
  const explicitSlug = readText(properties, PROPERTY_ALIASES.slug, "");
  const slug = slugify(explicitSlug || title, page.id);

  const blocks = await n2m.pageToMarkdown(page.id);
  const markdown = n2m.toMarkdownString(blocks);
  const body = typeof markdown === "string" ? markdown : markdown.parent;

  return {
    fileName: `${slug}.md`,
    content: `${toFrontmatter({ title, description, pubDatetime, tags })}${body.trim()}\n`,
  };
}

async function main() {
  await fs.mkdir(BLOG_DIR, { recursive: true });

  const pages = await queryAllPages();
  const publishedPages = pages.filter(page => isPublished(page.properties ?? {}));

  await removePreviouslySyncedFiles();

  const generatedFiles = [];
  for (const page of publishedPages) {
    const article = await pageToMarkdown(page);
    await fs.writeFile(path.join(BLOG_DIR, article.fileName), article.content);
    generatedFiles.push(article.fileName);
  }

  await fs.writeFile(
    MANIFEST_FILE,
    `${JSON.stringify({ files: generatedFiles.sort() }, null, 2)}\n`
  );

  process.stdout.write(`Synced ${generatedFiles.length} published Notion page(s).\n`);
}

main().catch(error => {
  process.stderr.write(`${error.stack ?? error.message ?? error}\n`);
  process.exit(1);
});

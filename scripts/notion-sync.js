import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");
const PUBLIC_DIR = path.join(process.cwd(), "public");
const NOTION_ASSETS_DIR = path.join(PUBLIC_DIR, "notion-assets");
const MANIFEST_FILE = path.join(BLOG_DIR, ".notion-sync-manifest.json");
const PUBLIC_BASE_PATH = (process.env.PUBLIC_BASE_PATH || "/vivi-site").replace(
  /\/$/,
  ""
);

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

n2m.setCustomTransformer("child_database", renderChildDatabase);

const PROPERTY_ALIASES = {
  title: ["Title", "Name", "标题", "名称"],
  description: ["Description", "Summary", "Excerpt", "摘要", "简介"],
  published: ["Published", "Publish", "已发布", "发布"],
  status: ["Status", "状态"],
  pubDatetime: ["PubDatetime", "Published At", "Date", "发布日期", "发布时间"],
  modDatetime: [
    "ModDatetime",
    "Updated At",
    "Last Edited",
    "Last Updated",
    "更新时间",
    "最后更新",
    "修改时间",
  ],
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

function escapeMarkdownText(value) {
  return value.replace(/([\\[\]])/g, "\\$1");
}

function richTextToMarkdown(richText = []) {
  return richText
    .map(item => {
      const label = escapeMarkdownText(item.plain_text ?? "");
      const href = item.href ?? item.text?.link?.url;
      return href ? `[${label}](${href})` : label;
    })
    .join("")
    .trim();
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

function readDate(properties, page) {
  const property = getProperty(properties, PROPERTY_ALIASES.pubDatetime);
  if (property?.type === "date" && property.date?.start) {
    return new Date(property.date.start).toISOString();
  }
  if (page?.created_time) {
    return new Date(page.created_time).toISOString();
  }
  if (page?.last_edited_time) {
    return new Date(page.last_edited_time).toISOString();
  }
  return new Date().toISOString();
}

function readOptionalDate(properties, aliases, page) {
  const property = getProperty(properties, aliases);
  if (property?.type === "date" && property.date?.start) {
    return new Date(property.date.start).toISOString();
  }
  if (property?.type === "last_edited_time" && property.last_edited_time) {
    return new Date(property.last_edited_time).toISOString();
  }
  if (page?.last_edited_time) {
    return new Date(page.last_edited_time).toISOString();
  }
  return undefined;
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

function markdownBodyToString(markdown) {
  if (typeof markdown === "string") return markdown;
  if (typeof markdown?.parent === "string") return markdown.parent;
  return "";
}

function readGroupNames(properties) {
  const property = getProperty(properties, [
    "Tags",
    "Tag",
    "Category",
    "标签",
    "分类",
  ]);

  if (property?.type === "select" && property.select?.name) {
    return [property.select.name];
  }
  if (property?.type === "multi_select") {
    return property.multi_select.map(item => item.name).filter(Boolean);
  }
  if (property?.type === "status" && property.status?.name) {
    return [property.status.name];
  }
  return [];
}

async function queryDataSourcePages(dataSourceId) {
  const pages = [];
  let cursor;

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

async function renderChildDatabase(block) {
  const database = await notion.databases.retrieve({
    database_id: block.id,
  });
  const dataSources = database.data_sources ?? [];
  const pages = (
    await Promise.all(
      dataSources.map(dataSource => queryDataSourcePages(dataSource.id))
    )
  ).flat();
  const groups = new Map();
  const fallbackGroup = block.child_database?.title || "内容";

  for (const page of pages) {
    if (page.object !== "page") continue;
    const properties = page.properties ?? {};
    const titleProperty = Object.values(properties).find(
      property => property.type === "title"
    );
    if (!titleProperty) continue;

    const title = richTextToMarkdown(titleProperty.title);
    if (!title) continue;

    const groupNames = readGroupNames(properties);
    for (const groupName of groupNames.length ? groupNames : [fallbackGroup]) {
      const items = groups.get(groupName) ?? [];
      items.push(title);
      groups.set(groupName, items);
    }
  }

  if (groups.size === 0) return `## ${fallbackGroup}\n\n暂无内容`;

  return [...groups.entries()]
    .map(
      ([groupName, items]) =>
        `## ${groupName}\n\n${items.map(item => `- ${item}`).join("\n")}`
    )
    .join("\n\n");
}

function isNotionImageUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.hostname.includes("prod-files-secure") ||
      url.hostname.includes("notion-static") ||
      url.hostname === "www.notion.so" ||
      url.hostname.endsWith(".amazonaws.com")
    );
  } catch {
    return false;
  }
}

function extensionFromContentType(contentType) {
  const cleanType = contentType?.split(";")[0]?.trim().toLowerCase();
  const extensions = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "image/avif": ".avif",
  };

  return extensions[cleanType] ?? "";
}

function extensionFromUrl(value) {
  try {
    const { pathname } = new URL(value);
    const extension = path.extname(pathname).toLowerCase();
    if (/^\.(jpe?g|png|gif|webp|svg|avif)$/.test(extension)) return extension;
  } catch {
    // Invalid URLs are ignored by the caller.
  }
  return "";
}

function publicAssetUrl(slug, fileName) {
  const encodedSlug = encodeURIComponent(slug);
  return `${PUBLIC_BASE_PATH}/notion-assets/${encodedSlug}/${fileName}`;
}

async function downloadImage(url, slug) {
  const response = await fetch(url, {
    headers: {
      Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Could not download Notion image (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const hash = crypto
    .createHash("sha256")
    .update(url)
    .update(buffer)
    .digest("hex")
    .slice(0, 16);
  const extension =
    extensionFromContentType(response.headers.get("content-type")) ||
    extensionFromUrl(url) ||
    ".bin";
  const fileName = `${hash}${extension}`;
  const assetDir = path.join(NOTION_ASSETS_DIR, slug);
  const filePath = path.join(assetDir, fileName);

  await fs.mkdir(assetDir, { recursive: true });
  await fs.writeFile(filePath, buffer);

  return {
    publicPath: publicAssetUrl(slug, fileName),
    manifestPath: path.posix.join("notion-assets", slug, fileName),
  };
}

async function localizeNotionImages(body, slug) {
  const imagePattern = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)([^)]*)\)/g;
  const replacements = new Map();
  const assetFiles = [];

  for (const match of body.matchAll(imagePattern)) {
    const [markdownImage, alt, url, suffix] = match;
    if (!isNotionImageUrl(url)) continue;
    if (!replacements.has(markdownImage)) {
      try {
        const asset = await downloadImage(url, slug);
        replacements.set(
          markdownImage,
          `![${alt}](${asset.publicPath}${suffix ?? ""})`
        );
        assetFiles.push(asset.manifestPath);
      } catch (error) {
        process.stderr.write(
          `Could not localize image for ${slug}: ${error.message ?? error}\n`
        );
      }
    }
  }

  let localizedBody = body;
  for (const [from, to] of replacements) {
    localizedBody = localizedBody.split(from).join(to);
  }

  return { body: localizedBody, assetFiles };
}

function toFrontmatter({ title, description, pubDatetime, modDatetime, tags }) {
  const frontmatter = [
    "---",
    `title: ${yamlString(title)}`,
    `description: ${yamlString(description)}`,
    `pubDatetime: ${pubDatetime}`,
  ];

  if (modDatetime) {
    frontmatter.push(`modDatetime: ${modDatetime}`);
  }

  frontmatter.push(`tags: ${yamlArray(tags)}`, "draft: false", "---", "");

  return frontmatter.join("\n");
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

async function queryAllPages() {
  const dataSourceId = await resolveDataSourceId();
  return queryDataSourcePages(dataSourceId);
}

async function readManifest() {
  try {
    return JSON.parse(await fs.readFile(MANIFEST_FILE, "utf8"));
  } catch {
    return { files: [], assets: [] };
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

  await Promise.all(
    (manifest.assets ?? []).map(async file => {
      try {
        await fs.unlink(path.join(PUBLIC_DIR, file));
      } catch {
        // The asset may have been deleted manually; keep the sync idempotent.
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
  const pubDatetime = readDate(properties, page);
  const modDatetime = readOptionalDate(
    properties,
    PROPERTY_ALIASES.modDatetime,
    page
  );
  const tags = readTags(properties);
  const explicitSlug = readText(properties, PROPERTY_ALIASES.slug, "");
  const slug = slugify(explicitSlug || title, page.id);

  const blocks = await n2m.pageToMarkdown(page.id);
  const markdown = n2m.toMarkdownString(blocks);
  const body = markdownBodyToString(markdown);
  const localized = await localizeNotionImages(body, slug);

  return {
    fileName: `${slug}.md`,
    content: `${toFrontmatter({
      title,
      description,
      pubDatetime,
      modDatetime,
      tags,
    })}${localized.body.trim()}\n`,
    assetFiles: localized.assetFiles,
  };
}

async function main() {
  await fs.mkdir(BLOG_DIR, { recursive: true });

  const pages = await queryAllPages();
  const publishedPages = pages.filter(page => isPublished(page.properties ?? {}));

  const generatedArticles = [];
  const generatedAssets = [];
  for (const page of publishedPages) {
    const article = await pageToMarkdown(page);
    generatedArticles.push(article);
    generatedAssets.push(...article.assetFiles);
  }

  // Convert every page successfully before replacing the last good sync.
  await removePreviouslySyncedFiles();

  const generatedFiles = [];
  for (const article of generatedArticles) {
    await fs.writeFile(path.join(BLOG_DIR, article.fileName), article.content);
    generatedFiles.push(article.fileName);
  }

  await fs.writeFile(
    MANIFEST_FILE,
    `${JSON.stringify(
      {
        files: generatedFiles.sort(),
        assets: generatedAssets.sort(),
      },
      null,
      2
    )}\n`
  );

  process.stdout.write(
    `Synced ${generatedFiles.length} published Notion page(s) and ${generatedAssets.length} image asset(s).\n`
  );
}

main().catch(error => {
  process.stderr.write(`${error.stack ?? error.message ?? error}\n`);
  process.exit(1);
});

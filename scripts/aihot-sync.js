import fs from "node:fs/promises";
import path from "node:path";

const OUTPUT_FILE = path.join(process.cwd(), "public/data/ai-hot.json");
const SOURCE_URL = "https://aihot.virxact.com";
const HOT_TOPICS_URL = "https://aihot.virxact.com/api/v1/hot-topics";
const ITEMS_URL = "https://aihot.virxact.com/api/v1/items";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 aihot-skill/0.2.0";

function stringValue(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeTopic(topic, matchedItem) {
  return {
    id: stringValue(topic.id),
    title: stringValue(topic.title, stringValue(matchedItem?.title, "未命名热点")),
    url: stringValue(
      topic.links?.original,
      stringValue(topic.links?.aihot, SOURCE_URL)
    ),
    aihotUrl: stringValue(topic.links?.aihot, SOURCE_URL),
    summary: stringValue(matchedItem?.summary, "AI HOT 暂未提供这条热点的摘要。"),
    latestAt: stringValue(topic.latestAt, stringValue(matchedItem?.publishedAt)),
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`AIHOT sync failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function findSummaryForTopic(topic) {
  const url = new URL(ITEMS_URL);
  url.searchParams.set("mode", "all");
  url.searchParams.set("window", "7d");
  url.searchParams.set("limit", "5");
  url.searchParams.set("q", stringValue(topic.title));

  const payload = await fetchJson(url);
  const items = Array.isArray(payload.items) ? payload.items : [];
  return items.sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))[0];
}

async function main() {
  const hotTopics = await fetchJson(HOT_TOPICS_URL);
  const topics = Array.isArray(hotTopics.items) ? hotTopics.items.slice(0, 5) : [];
  const matchedItems = [];

  for (const topic of topics) {
    matchedItems.push(await findSummaryForTopic(topic));
  }

  const output = {
    sourceName: "AI HOT",
    sourceUrl: SOURCE_URL,
    generatedAt: new Date().toISOString(),
    mode: "hot-topics",
    items: topics.map((topic, index) => normalizeTopic(topic, matchedItems[index])),
  };

  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`);
  process.stdout.write(`Synced ${output.items.length} AIHOT item(s).\n`);
}

main().catch(error => {
  process.stderr.write(`${error.stack ?? error.message ?? error}\n`);
  process.exit(1);
});

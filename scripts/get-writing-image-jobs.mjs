import { getWritingPromptCatalog } from "../content/naplan-bank/scripts/writing-prompt-catalog.mjs";

const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  args.set(process.argv[index], process.argv[index + 1]);
}

const start = Math.max(0, Number.parseInt(args.get("--start") ?? "0", 10));
const count = Math.max(1, Number.parseInt(args.get("--count") ?? "400", 10));
const jobs = [3, 5, 7, 9].flatMap((year) => getWritingPromptCatalog(year).map((item) => ({
  year,
  catalog_id: item.catalog_id,
  genre: item.genre,
  title: item.title,
  asset_id: item.image.asset_id,
  target: `public${item.image.src}`,
  prompt: item.image.generation_prompt,
})));

process.stdout.write(JSON.stringify(jobs.slice(start, start + count)));


/**
 * Base configuration seed. Creates NO demo/sample data and never deletes anything.
 * Only ensures the physical-testing checklist (quality parameters) exists; safe to run repeatedly.
 * Run with: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const CHECKLIST = [
  ["Appearance", "Overall look of the grain sample"],
  ["Color", "Colour consistent with the millet variety"],
  ["Odor", "No musty, fermented or chemical smell"],
  ["Moisture", "Hand/meter moisture check — grain feels dry, no clumping"],
  ["Foreign Matter", "Stones, husk, dust, other seeds"],
  ["Visible Damage", "Broken, shrivelled, insect-damaged grains"],
  ["Grain Uniformity", "Consistent size and shape"],
  ["Cleanliness", "Sample cleaned and free of debris"],
  ["Storage Condition", "Condition of storage at the farm"],
  ["Processing Condition", "Dehusking / cleaning / drying quality"],
  ["Packaging Condition", "Bags intact, dry, food-safe"],
];

async function main() {
  let created = 0;
  for (const [i, [name, description]] of CHECKLIST.entries()) {
    const exists = await db.testChecklistItem.findUnique({ where: { name } });
    if (!exists) {
      await db.testChecklistItem.create({ data: { name, description, sortOrder: i } });
      created++;
    }
  }
  console.log(`Checklist ready (${created} item(s) added).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

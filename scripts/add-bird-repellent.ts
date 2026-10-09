// Adds (or updates) the "Smart AI Bird Repellent System" hardware product, published and featured.
// Safe to re-run: matches on the slug and updates the existing product in place.
// Run: npx tsx scripts/add-bird-repellent.ts
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const SLUG = "smart-ai-bird-repellent-system";

const product = {
  name: "Smart AI Bird Repellent System",
  category: "CROP_PROTECTION" as const,
  description:
    "An automated crop-protection system that watches your field with a CCTV camera, detects birds using AI and plays an acoustic deterrent to encourage them to leave.",
  mainBenefit: "Protect your crops and reduce bird damage, without watching the field all day",
  overview: `Protect your crops. Reduce bird damage. Farm smarter.

Our Smart AI Bird Repellent System is an automated crop-protection solution designed to help farmers reduce bird-related damage to millet and other agricultural crops. It combines CCTV-based monitoring, AI-powered bird detection, Raspberry Pi control and an acoustic deterrent to detect bird activity and respond automatically.

Why do you need it? Birds can cause significant damage to crops, particularly during the grain-filling and crop-maturity stages. Continuous manual monitoring takes time and effort and may not be practical for larger fields. This system monitors the field and responds automatically when birds are detected.

Custom farm solution: every farm is different. Instead of a fixed configuration, we design the system around your farm — farm size, crop type, required coverage area, number of cameras and speakers, power availability and installation requirements. Send an enquiry with your farm details for a customised quotation.

Important note: this is a non-lethal bird deterrence solution. Its effectiveness can vary depending on bird species, environmental conditions, field layout, crop type, system placement and other factors. It is intended to help reduce bird activity and crop damage, not to guarantee complete prevention.`,
  features: `AI-based bird detection — uses computer vision to identify birds from the camera feed
Automated operation — activates the deterrent automatically when bird activity is detected
Real-time monitoring — continuously monitors the protected crop area
Non-lethal approach — designed to discourage birds without physically harming them
Customisable — the number of cameras and speakers is configured for your farm and coverage needs
Reduced manual monitoring — less need for continuous physical watching of the field
Optional solar power — a solar-powered setup can be considered where grid electricity is unavailable or unreliable`,
  benefits: `Helps reduce bird-related crop damage
Saves time spent manually monitoring fields
Provides automated crop protection
Supports modern technology-based farming
Can be customised for different farm sizes
Suitable for millet and other suitable agricultural crops`,
  specifications: `CCTV Camera: Monitors the crop field
Raspberry Pi: Main processing and control unit
YOLO AI: Detects birds from camera footage
Speaker: Produces the acoustic deterrent
Power Supply: Powers the system
Weatherproof Enclosure: Protects the electronics
Mounting System: Positions the camera and speaker
Basic package (small farms): ₹15,000 — Raspberry Pi, camera, speaker, AI detection system, power supply, basic installation support
Standard package (medium farms): ₹25,000 — Raspberry Pi, higher-quality camera, multiple speakers, AI/YOLO detection, weather-protected enclosure, power system, installation and configuration
Advanced package (larger farms): ₹40,000 — Raspberry Pi controller, multiple cameras, multiple speakers, AI-based detection, weather-protected hardware, extended coverage, installation, testing and deployment support
Price note: Prices are estimates and may vary with farm size, coverage area, number of cameras/speakers, installation requirements and hardware specifications`,
  suitableFor: `Millet farmers facing bird damage during grain filling and crop maturity
Farmers growing other crops affected by birds
Small farms — Basic package
Medium-sized farms — Standard package
Larger farms — Advanced package
Farms without reliable grid electricity (optional solar configuration)`,
  howItWorks: `Monitor — a CCTV camera continuously watches the selected crop area.
Detect — our YOLO-based AI detection system analyses the camera feed and identifies birds.
Process — when a bird is detected, the Raspberry Pi processes the detection and triggers the deterrent.
Deter — the connected speaker plays a suitable acoustic deterrent to encourage the birds to leave the protected area.
Monitor again — once bird activity is no longer detected, the system goes back to monitoring mode.`,
  featured: true,
};

(async () => {
  const existing = await db.hardwareProduct.findUnique({ where: { slug: SLUG } });
  const saved = existing
    ? await db.hardwareProduct.update({ where: { id: existing.id }, data: { ...product, status: "PUBLISHED", publishedAt: existing.publishedAt ?? new Date() } })
    : await db.hardwareProduct.create({ data: { ...product, slug: SLUG, status: "PUBLISHED", publishedAt: new Date() } });
  await db.auditLog.create({
    data: { actorRole: "SYSTEM", action: existing ? "hardware.update" : "hardware.create", entity: "HardwareProduct", entityId: saved.id, details: `${saved.name} (script: add-bird-repellent)` },
  });
  console.log(`${existing ? "Updated" : "Created"}: ${saved.name} → /farmer/hardware/${saved.slug} (${saved.status})`);
  await db.$disconnect();
})();

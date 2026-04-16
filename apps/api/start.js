const { execSync } = require("child_process");
const path = require("path");

const prisma = path.join(__dirname, "node_modules", ".bin", "prisma");
const schema = path.join(__dirname, "apps", "api", "prisma", "schema.prisma");

console.log("[EcoTrack] Running migrations...");
try {
  execSync(`${prisma} migrate deploy --schema ${schema}`, { stdio: "inherit" });
  console.log("[EcoTrack] Migrations OK");
} catch (e) {
  console.error("[EcoTrack] Migration failed:", e.message);
  console.error("[EcoTrack] Continuing startup...");
}

console.log("[EcoTrack] Starting server...");
console.log("[EcoTrack] DATABASE_URL:", !!process.env.DATABASE_URL);
console.log("[EcoTrack] JWT_SECRET:", !!process.env.JWT_SECRET);
console.log("[EcoTrack] PORT:", process.env.PORT || 3001);

require("./apps/api/dist/apps/api/src/server.js");

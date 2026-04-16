const { execSync } = require("child_process");
const path = require("path");

const schema = path.join(__dirname, "apps", "api", "prisma", "schema.prisma");

console.log("[EcoTrack] Running migrations...");
try {
  execSync(`npx prisma migrate deploy --schema ${schema}`, { stdio: "inherit" });
  console.log("[EcoTrack] Migrations OK");
} catch (e) {
  console.error("[EcoTrack] Migration failed:", e.message);
  console.error("[EcoTrack] Continuing startup — DB may need manual migration");
}

console.log("[EcoTrack] Starting server...");
console.log("[EcoTrack] DATABASE_URL set:", !!process.env.DATABASE_URL);
console.log("[EcoTrack] REDIS_URL set:", !!process.env.REDIS_URL);
console.log("[EcoTrack] JWT_SECRET set:", !!process.env.JWT_SECRET);
console.log("[EcoTrack] PORT:", process.env.PORT || 3001);

require("./dist/apps/api/src/server.js");

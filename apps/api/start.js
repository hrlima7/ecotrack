const { execSync } = require("child_process");
const path = require("path");

const schema = path.join(__dirname, "apps", "api", "prisma", "schema.prisma");

console.log("[EcoTrack] Running migrations...");
try {
  execSync(`npx prisma migrate deploy --schema ${schema}`, { stdio: "inherit" });
} catch (e) {
  console.error("[EcoTrack] Migration failed — starting server anyway:", e.message);
}

console.log("[EcoTrack] Starting server...");
require("./dist/apps/api/src/server.js");

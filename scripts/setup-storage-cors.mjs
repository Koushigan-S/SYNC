import fs from "fs";
import os from "os";
import path from "path";

async function run() {
  const configPath = path.join(os.homedir(), ".config/configstore/firebase-tools.json");
  if (!fs.existsSync(configPath)) {
    console.error("Firebase CLI config not found at", configPath);
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const token = config.tokens?.access_token;
  if (!token) {
    console.error("No access token found in firebase-tools.json");
    process.exit(1);
  }

  const projectId = "sync-4517e";
  console.log(`Checking storage buckets for project ${projectId}...`);

  const listRes = await fetch(`https://storage.googleapis.com/storage/v1/b?project=${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const listData = await listRes.json();
  const buckets = listData.items || [];

  if (buckets.length === 0) {
    console.log("⚠️ No storage buckets found yet for project " + projectId);
    console.log("👉 Go to https://console.firebase.google.com/project/sync-4517e/storage and click 'Get Started'!");
    return;
  }

  for (const b of buckets) {
    console.log(`Configuring CORS on bucket: ${b.name}...`);
    const corsRes = await fetch(`https://storage.googleapis.com/storage/v1/b/${b.name}?fields=cors`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cors: [
          {
            origin: ["*"],
            method: ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
            responseHeader: ["*"],
            maxAgeSeconds: 3600,
          },
        ],
      }),
    });

    const corsData = await corsRes.json();
    console.log(`✅ CORS successfully configured for ${b.name}:`, corsData.cors);
  }
}

run().catch(console.error);

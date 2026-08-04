import type { NextConfig } from "next";

// Pin the tracing root to the repo root so Next stops guessing when it finds
// another lockfile up the tree (iCloud-synced parent folder) and warns about
// the workspace root.
const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;

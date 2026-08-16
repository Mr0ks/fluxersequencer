import type { NextConfig } from "next";

const githubPagesPrefix = process.env.GITHUB_PAGES_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  assetPrefix: githubPagesPrefix || undefined,
};

export default nextConfig;

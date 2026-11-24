/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
    serverActions: { bodySizeLimit: "6mb" },
  },
};
export default nextConfig;

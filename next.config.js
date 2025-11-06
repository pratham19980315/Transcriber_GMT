/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb", // allow big audio uploads
    },
  },
};

module.exports = nextConfig;

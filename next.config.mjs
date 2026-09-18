/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Allow larger creative uploads in App Router route handlers
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;

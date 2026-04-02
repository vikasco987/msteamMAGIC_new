// Deprecated: Migrated to next.config.ts
module.exports = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'images.clerk.dev' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};
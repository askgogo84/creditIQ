/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },
  async redirects() {
    return [
      // Route consolidation: the duplicate /cards/:slug detail route was retired.
      // 308 permanent redirect to the canonical /card/:slug. Matches only the
      // single :slug child — the /cards index page is unaffected.
      {
        source: '/cards/:slug',
        destination: '/card/:slug',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;

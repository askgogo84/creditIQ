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
      // Front-door consolidation: /landing is the retired twin of the home page
      // (both render the same components/marketing/landing/* surface). 308 permanent
      // to the canonical home so there is one front door, not two. The unreachable
      // app/(marketing)/landing/page.tsx is now dead code — deletable in the #14 sweep.
      {
        source: '/landing',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;

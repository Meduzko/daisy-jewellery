/** @type {import('next').NextConfig} */

const nextConfig = {
  // images: {
  //   domains: ['cdn.dntrade.com.ua'],
  //   formats: ['image/avif', 'image/webp']
  // }
  images: {
    domains: ['cdn.dntrade.com.ua'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.dntrade.com.ua',
        pathname: '/**', // Allow all images from this domain
      },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 7, // Cache for 7 days
    // formats: ['image/avif', 'image/webp'],
  },
  // async redirects() {
  //   return [
  //     {
  //       source: '/category/:slug/page/1',
  //       destination: '/category/:slug',
  //       permanent: true,
  //     },
  //   ];
  // },
};

export default nextConfig;

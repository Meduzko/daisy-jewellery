/** @type {import('next').NextConfig} */

const nextConfig = {
  images: {
    domains: ['cdn.dntrade.com.ua'],
  }
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

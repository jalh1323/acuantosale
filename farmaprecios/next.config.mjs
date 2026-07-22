/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',  // Farmatodo
      },
      {
        protocol: 'https',
        hostname: 'locatelvenezuela.vtexassets.com',  // Locatel
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',  // Fallback placeholder
      },
    ],
  },
}

export default nextConfig

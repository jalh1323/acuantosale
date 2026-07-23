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
        hostname: 'egb2c.cl94ncbhsi-excelsior1-p1-public.model-t.cc.commerce.ondemand.com',  // Gama images
      },
      {
        protocol: 'https',
        hostname: 'nyc3.digitaloceanspaces.com',  // Luvebras images
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',  // Fallback placeholder
      },
    ],
  },
}

export default nextConfig

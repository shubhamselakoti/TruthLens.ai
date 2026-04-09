/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mongoose', 'natural'],
  },
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    WIKIPEDIA_API_URL: process.env.WIKIPEDIA_API_URL,
  },
}

module.exports = nextConfig

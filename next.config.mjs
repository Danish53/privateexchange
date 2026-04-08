import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  // Windows: paths like `...\package (10)\...` often cause `_buildManifest.js.tmp` ENOENT.
  // Fix: move the project or open it via a junction with no parentheses (see README note in response).
  // Optional: NEXT_DIST_DIR=.next-alt when `.next` is locked (EPERM).
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

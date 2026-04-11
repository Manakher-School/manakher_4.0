import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable source maps in development to reduce memory usage
  productionBrowserSourceMaps: false,

  // Cache configuration to prevent memory leaks
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // Remove unused pages after 60 seconds
    pagesBufferLength: 5, // Keep only 5 pages in memory
  },

  // Experimental optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      "@radix-ui/react-dropdown-menu",
      "lucide-react",
      "@tiptap/react",
      "@tiptap/starter-kit",
    ],
  },
};

export default nextConfig;

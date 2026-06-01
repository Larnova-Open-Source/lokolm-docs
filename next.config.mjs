import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force process.cwd() to its canonical filesystem casing
const canonicalCwd = fs.realpathSync.native(__dirname);
if (process.cwd().toLowerCase() === canonicalCwd.toLowerCase() && process.cwd() !== canonicalCwd) {
  process.chdir(canonicalCwd);
}

/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

// Webpack resolver plugin to force canonical filesystem casing on all resolved paths.
// This prevents duplicate module caching and hydration crashes on Windows.
class CanonicalResolvePlugin {
  apply(resolver) {
    resolver.getHook('resolved').tapAsync('CanonicalResolvePlugin', (request, resolveContext, callback) => {
      if (request.path && request.path.toLowerCase().includes('lokolm')) {
        try {
          const canonical = fs.realpathSync.native(request.path);
          if (request.path !== canonical) {
            request.path = canonical;
          }
        } catch (e) {
          // Ignore files that don't exist on disk or resolve errors
        }
      }
      callback();
    });
  }
}

const nextConfig = {
  // Static HTML export (the `out/` folder Netlify serves) is only needed for the
  // production build. Enabling it in `next dev` breaks dynamic routes
  // (it demands generateStaticParams per request), so gate it to production.
  ...(isProd ? { output: "export" } : {}),
  images: { unoptimized: true },
  trailingSlash: true,
  
  webpack: (config) => {
    // Add our canonical path resolver plugin
    config.resolve.plugins = config.resolve.plugins || [];
    config.resolve.plugins.push(new CanonicalResolvePlugin());
    return config;
  }
};

export default nextConfig;

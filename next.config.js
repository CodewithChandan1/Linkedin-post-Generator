/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.pollinations.ai" },
    ],
  },
  webpack: (config, { webpack, isServer }) => {
    if (!isServer) {
      // pptxgenjs has dynamic `import('node:fs')`/`node:https` for its Node code
      // paths; in the browser we use the download path instead. Strip the
      // `node:` scheme and stub these modules so the client bundle compiles.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        https: false,
        http: false,
        os: false,
        path: false,
      };
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:(fs|https|http|os|path)$/, (resource) => {
          resource.request = resource.request.replace(/^node:/, "");
        })
      );
    }
    return config;
  },
};

module.exports = nextConfig;

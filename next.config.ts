const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8090",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8090",
      },
    ],
  },
};

export default nextConfig;

function getAppwriteRemotePattern() {
  const appwriteEndpoint = process.env.APPWRITE_ENDPOINT;

  if (!appwriteEndpoint) {
    return null;
  }

  try {
    const url = new URL(appwriteEndpoint);

    return {
      protocol: url.protocol.replace(":", ""),
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
    };
  } catch {
    return null;
  }
}

const appwriteRemotePattern = getAppwriteRemotePattern();

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...(appwriteRemotePattern ? [appwriteRemotePattern] : []),
    ],
  },
};

export default nextConfig;

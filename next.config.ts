import { APPWRITE_ENDPOINT } from "./src/lib/appwrite/constants";

function getAppwriteRemotePattern() {
  try {
    const url = new URL(APPWRITE_ENDPOINT);

    return {
      protocol: url.protocol.replace(":", ""),
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
    };
  } catch {
    return null;
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

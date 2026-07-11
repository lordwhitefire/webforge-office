declare global {
  const WEBFORGE_VERSION: string
  const WEBFORGE_CHANNEL: string
}

export const InstallationVersion = typeof WEBFORGE_VERSION === "string" ? WEBFORGE_VERSION : "local"
export const InstallationChannel = typeof WEBFORGE_CHANNEL === "string" ? WEBFORGE_CHANNEL : "local"
export const InstallationLocal = InstallationChannel === "local"

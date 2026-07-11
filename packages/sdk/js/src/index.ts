export * from "./client.js"
export * from "./server.js"

import { createWebforgeClient } from "./client.js"
import { createWebforgeServer } from "./server.js"
import type { ServerOptions } from "./server.js"

export async function createWebforge(options?: ServerOptions) {
  const server = await createWebforgeServer({
    ...options,
  })

  const client = createWebforgeClient({
    baseUrl: server.url,
  })

  return {
    client,
    server,
  }
}

import { $ } from "bun"

await $`bun ./scripts/copy-icons.ts ${process.env.WEBFORGE_CHANNEL ?? "dev"}`

await $`cd ../webforge && bun script/build-node.ts`

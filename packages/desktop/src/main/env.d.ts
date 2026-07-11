interface ImportMetaEnv {
  readonly WEBFORGE_CHANNEL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "virtual:webforge-server" {
  export namespace Server {
    export const listen: typeof import("../../../webforge/dist/types/src/node").Server.listen
    export type Listener = import("../../../webforge/dist/types/src/node").Server.Listener
  }
  export namespace Config {
    export const get: typeof import("../../../webforge/dist/types/src/node").Config.get
    export type Info = import("../../../webforge/dist/types/src/node").Config.Info
  }
  export const bootstrap: typeof import("../../../webforge/dist/types/src/node").bootstrap
}

import { LayerNode } from "@webforge-ai/core/effect/layer-node"
import { AppNodeBuilder } from "@webforge-ai/core/effect/app-node-builder"
import { Effect, Layer, Schema, Context } from "effect"
import { serviceUse } from "@webforge-ai/core/effect/service-use"
import { makeRuntime } from "@webforge-ai/core/effect/runtime"
import semver from "semver"
import { InstallationChannel, InstallationVersion } from "@webforge-ai/core/installation/version"
import { InstallationEvent } from "@webforge-ai/schema/installation-event"

/**
 * WebForge Code — Installation module.
 *
 * AUTO-UPDATE HAS BEEN PERMANENTLY REMOVED.
 *
 * WebForge Code does not phone home, does not check for new versions, and does
 * not self-install newer builds from any external source. The only way to
 * update WebForge Code is to re-run the official WebForge installer or rebuild
 * from source. The `latest`, `upgrade`, and `method` functions below are kept
 * as no-op stubs only so that existing call sites in the codebase continue to
 * type-check; they perform no network I/O and never will.
 */

export type Method = "curl" | "npm" | "yarn" | "pnpm" | "bun" | "brew" | "scoop" | "choco" | "unknown"

export type ReleaseType = "patch" | "minor" | "major"

export const Event = InstallationEvent

export function getReleaseType(current: string, latest: string): ReleaseType {
  const currMajor = semver.major(current)
  const currMinor = semver.minor(current)
  const newMajor = semver.major(latest)
  const newMinor = semver.minor(latest)

  if (newMajor > currMajor) return "major"
  if (newMinor > currMinor) return "minor"
  return "patch"
}

export const Info = Schema.Struct({
  version: Schema.String,
  latest: Schema.String,
}).annotate({ identifier: "InstallationInfo" })
export type Info = Schema.Schema.Type<typeof Info>

export function userAgent(client = "cli") {
  return `webforge/${InstallationChannel}/${InstallationVersion}/${client}`
}

export const USER_AGENT = userAgent()

export function isPreview() {
  return InstallationChannel !== "latest"
}

export function isLocal() {
  return InstallationChannel === "local"
}

export class UpgradeFailedError extends Schema.TaggedErrorClass<UpgradeFailedError>()("UpgradeFailedError", {
  stderr: Schema.String,
}) {
  override get message() {
    return this.stderr
  }
}

export interface Interface {
  readonly info: () => Effect.Effect<Info>
  readonly method: () => Effect.Effect<Method>
  readonly latest: (method?: Method) => Effect.Effect<string>
  readonly upgrade: (method: Method, target: string) => Effect.Effect<void, UpgradeFailedError>
}

export class Service extends Context.Service<Service, Interface>()("@webforge/Installation") {}

export const use = serviceUse(Service)

const layer: Layer.Layer<Service, never> = Layer.effect(
  Service,
  Effect.gen(function* () {
    const result: Interface = {
      info: Effect.fn("Installation.info")(function* () {
        return {
          version: InstallationVersion,
          latest: InstallationVersion,
        }
      }),
      method: Effect.fn("Installation.method")(function* () {
        // Auto-update removed — always report "unknown" so no external resolver
        // ever believes it can manage this binary.
        return "unknown" as Method
      }),
      latest: Effect.fn("Installation.latest")(function* () {
        // Auto-update removed — never reach out to npm/brew/choco/scoop/GitHub.
        // Return the currently running version so any caller that compares
        // current vs. latest sees "up to date" and never triggers an upgrade.
        return InstallationVersion
      }),
      upgrade: Effect.fn("Installation.upgrade")(function* () {
        // Auto-update permanently disabled. WebForge only updates through the
        // official WebForge installer or a from-source rebuild.
        return yield* new UpgradeFailedError({
          stderr:
            "WebForge Code auto-update is permanently disabled. " +
            "To update, re-run the official WebForge installer or rebuild from source.",
        })
      }),
    }

    return Service.of(result)
  }),
)

export const node = LayerNode.make({ service: Service, layer: layer, deps: [] })

const { runPromise } = makeRuntime(Service, AppNodeBuilder.build(node))

export const latest = (...args: Parameters<Interface["latest"]>) => runPromise((s) => s.latest(...args))
export const method = () => runPromise((s) => s.method())
export const upgrade = (...args: Parameters<Interface["upgrade"]>) => runPromise((s) => s.upgrade(...args))

export * as Installation from "."

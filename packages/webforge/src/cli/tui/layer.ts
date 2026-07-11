import { run as runTui, type TuiInput } from "@webforge-ai/tui"
import { Global } from "@webforge-ai/core/global"
import { AppNodeBuilder } from "@webforge-ai/core/effect/app-node-builder"
import { Effect } from "effect"

export function run(input: TuiInput) {
  return runTui(input).pipe(Effect.provide(AppNodeBuilder.build(Global.node)))
}

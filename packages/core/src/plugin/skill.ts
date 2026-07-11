/// <reference path="../markdown.d.ts" />

export * as SkillPlugin from "./skill"

import { define } from "./internal"
import { Effect } from "effect"
import { AbsolutePath } from "../schema"
import { SkillV2 } from "../skill"
import customizeWebforgeContent from "./skill/customize-webforge.md" with { type: "text" }

export const CustomizeWebforgeContent = customizeWebforgeContent

export const Plugin = define({
  id: "skill",
  effect: Effect.fn(function* (ctx) {
    yield* ctx.skill.transform((draft) => {
      draft.source(
        SkillV2.EmbeddedSource.make({
          type: "embedded",
          skill: SkillV2.Info.make({
            name: "customize-webforge",
            description:
              "Use ONLY when the user is editing or creating webforge's own configuration: webforge.json, webforge.jsonc, files under .webforge/, or files under ~/.config/webforge/. Also use when creating or fixing webforge agents, subagents, commands, skills, plugins, MCP servers, or permission rules. Do not use for the user's own application code, or for any project that is not configuring webforge itself.",
            location: AbsolutePath.make("/builtin/customize-webforge.md"),
            content: CustomizeWebforgeContent,
          }),
        }),
      )
    })
  }),
})

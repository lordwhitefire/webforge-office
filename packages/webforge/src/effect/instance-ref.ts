import { Context } from "effect"
import type { InstanceContext } from "@/project/instance-context"
import type { WorkspaceV2 } from "@webforge-ai/core/workspace"

export const InstanceRef = Context.Reference<InstanceContext | undefined>("~webforge/InstanceRef", {
  defaultValue: () => undefined,
})

export const WorkspaceRef = Context.Reference<WorkspaceV2.ID | undefined>("~webforge/WorkspaceRef", {
  defaultValue: () => undefined,
})

import { AgentV2 } from "@webforge-ai/core/agent"
import { AISDK } from "@webforge-ai/core/aisdk"
import { Catalog } from "@webforge-ai/core/catalog"
import { CommandV2 } from "@webforge-ai/core/command"
import { Credential } from "@webforge-ai/core/credential"
import { AppNodeBuilder } from "@webforge-ai/core/effect/app-node-builder"
import { LayerNodePlatform } from "@webforge-ai/core/effect/app-node-platform"
import { LayerNode } from "@webforge-ai/core/effect/layer-node"
import { EventV2 } from "@webforge-ai/core/event"
import { FileSystem } from "@webforge-ai/core/filesystem"
import { FSUtil } from "@webforge-ai/core/fs-util"
import { Integration } from "@webforge-ai/core/integration"
import { Location } from "@webforge-ai/core/location"
import { Npm } from "@webforge-ai/core/npm"
import { PluginV2 } from "@webforge-ai/core/plugin"
import { Reference } from "@webforge-ai/core/reference"
import { SkillV2 } from "@webforge-ai/core/skill"
import { Effect, Layer } from "effect"
import { tempLocationLayer } from "../fixture/location"

const npmLayer = Layer.succeed(
  Npm.Service,
  Npm.Service.of({
    add: () => Effect.succeed({ directory: "", entrypoint: undefined }),
    install: () => Effect.void,
    which: () => Effect.succeed(undefined),
  }),
)

export const PluginTestLayer = AppNodeBuilder.build(
  LayerNode.group([
    FileSystem.node,
    FSUtil.node,
    Location.node,
    Npm.node,
    Credential.node,
    EventV2.node,
    LayerNodePlatform.httpClient,
    PluginV2.node,
    AgentV2.node,
    AISDK.node,
    Catalog.node,
    CommandV2.node,
    Integration.node,
    Reference.node,
    SkillV2.node,
  ]),
  [
    [Location.node, tempLocationLayer],
    [Npm.node, npmLayer],
  ],
)

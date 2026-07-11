// @ts-nocheck

import { WebForge } from "@webforge-ai/core"
import { ReadTool } from "@webforge-ai/core/tools"

const webforge = WebForge.make({})

webforge.tool.add(ReadTool)

webforge.tool.add({
  name: "bash",
  schema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The command to run.",
      },
    },
    required: ["command"],
  },
  execute(input, ctx) {},
})

webforge.auth.add({
  provider: "openai",
  type: "api",
  value: process.env.OPENAI_API_KEY,
})

webforge.agent.add({
  name: "build",
  permissions: [],
  model: {
    id: "gpt-5-5",
    provider: "openai",
    variant: "xhigh",
  },
})

const sessionID = await webforge.session.create({
  agent: "build",
})

webforge.subscribe((event) => {
  console.log(event)
})

await webforge.session.prompt({
  sessionID,
  text: "hey what is up",
})

await webforge.session.prompt({
  sessionID,
  text: "what is up with this",
  files: [
    {
      mime: "image/png",
      uri: "data:image/png;base64,xxxx",
    },
  ],
})

await webforge.session.wait()

console.log(await webforge.session.messages(sessionID))

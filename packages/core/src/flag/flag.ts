import { Config } from "effect"

export function truthy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "true" || value === "1"
}

const copy = process.env["WEBFORGE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"]
const fff = process.env["WEBFORGE_DISABLE_FFF"]

function enabledByExperimental(key: string) {
  return process.env[key] === undefined ? truthy("WEBFORGE_EXPERIMENTAL") : truthy(key)
}

export const Flag = {
  OTEL_EXPORTER_OTLP_ENDPOINT: process.env["OTEL_EXPORTER_OTLP_ENDPOINT"],
  OTEL_EXPORTER_OTLP_HEADERS: process.env["OTEL_EXPORTER_OTLP_HEADERS"],

  WEBFORGE_AUTO_HEAP_SNAPSHOT: truthy("WEBFORGE_AUTO_HEAP_SNAPSHOT"),
  WEBFORGE_GIT_BASH_PATH: process.env["WEBFORGE_GIT_BASH_PATH"],
  WEBFORGE_CONFIG: process.env["WEBFORGE_CONFIG"],
  WEBFORGE_CONFIG_CONTENT: process.env["WEBFORGE_CONFIG_CONTENT"],
  // Auto-update flags permanently removed. WebForge does not phone home.
  WEBFORGE_DISABLE_PRUNE: truthy("WEBFORGE_DISABLE_PRUNE"),
  WEBFORGE_DISABLE_TERMINAL_TITLE: truthy("WEBFORGE_DISABLE_TERMINAL_TITLE"),
  WEBFORGE_SHOW_TTFD: truthy("WEBFORGE_SHOW_TTFD"),
  WEBFORGE_DISABLE_AUTOCOMPACT: truthy("WEBFORGE_DISABLE_AUTOCOMPACT"),
  WEBFORGE_DISABLE_MODELS_FETCH: truthy("WEBFORGE_DISABLE_MODELS_FETCH"),
  WEBFORGE_DISABLE_MOUSE: truthy("WEBFORGE_DISABLE_MOUSE"),
  WEBFORGE_FAKE_VCS: process.env["WEBFORGE_FAKE_VCS"],
  WEBFORGE_SERVER_PASSWORD: process.env["WEBFORGE_SERVER_PASSWORD"],
  WEBFORGE_SERVER_USERNAME: process.env["WEBFORGE_SERVER_USERNAME"],
  WEBFORGE_DISABLE_FFF: fff === undefined ? process.platform === "win32" : truthy("WEBFORGE_DISABLE_FFF"),

  // Experimental
  WEBFORGE_EXPERIMENTAL_FILEWATCHER: Config.boolean("WEBFORGE_EXPERIMENTAL_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),
  WEBFORGE_EXPERIMENTAL_DISABLE_FILEWATCHER: Config.boolean("WEBFORGE_EXPERIMENTAL_DISABLE_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),
  WEBFORGE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT:
    copy === undefined ? process.platform === "win32" : truthy("WEBFORGE_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"),
  WEBFORGE_MODELS_URL: process.env["WEBFORGE_MODELS_URL"],
  WEBFORGE_MODELS_PATH: process.env["WEBFORGE_MODELS_PATH"],
  WEBFORGE_DB: process.env["WEBFORGE_DB"],

  WEBFORGE_WORKSPACE_ID: process.env["WEBFORGE_WORKSPACE_ID"],
  WEBFORGE_EXPERIMENTAL_WORKSPACES: enabledByExperimental("WEBFORGE_EXPERIMENTAL_WORKSPACES"),

  // Evaluated at access time (not module load) because tests, the CLI, and
  // external tooling set these env vars at runtime.
  get WEBFORGE_DISABLE_PROJECT_CONFIG() {
    return truthy("WEBFORGE_DISABLE_PROJECT_CONFIG")
  },
  get WEBFORGE_EXPERIMENTAL_REFERENCES() {
    return enabledByExperimental("WEBFORGE_EXPERIMENTAL_REFERENCES")
  },
  get WEBFORGE_TUI_CONFIG() {
    return process.env["WEBFORGE_TUI_CONFIG"]
  },
  get WEBFORGE_CONFIG_DIR() {
    return process.env["WEBFORGE_CONFIG_DIR"]
  },
  get WEBFORGE_PURE() {
    return truthy("WEBFORGE_PURE")
  },
  get WEBFORGE_PERMISSION() {
    return process.env["WEBFORGE_PERMISSION"]
  },
  get WEBFORGE_PLUGIN_META_FILE() {
    return process.env["WEBFORGE_PLUGIN_META_FILE"]
  },
  get WEBFORGE_CLIENT() {
    return process.env["WEBFORGE_CLIENT"] ?? "cli"
  },
}

import path from "path"

process.env.WEBFORGE_DB = ":memory:"
process.env.WEBFORGE_MODELS_PATH = path.join(import.meta.dir, "plugin", "fixtures", "models-dev.json")
process.env.WEBFORGE_DISABLE_MODELS_FETCH = "true"

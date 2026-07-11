import { describe, expect, test } from "bun:test"
import { parsePluginSpecifier } from "../../src/plugin/shared"

describe("parsePluginSpecifier", () => {
  test("parses standard npm package without version", () => {
    expect(parsePluginSpecifier("acme")).toEqual({
      pkg: "acme",
      version: "latest",
    })
  })

  test("parses standard npm package with version", () => {
    expect(parsePluginSpecifier("acme@1.0.0")).toEqual({
      pkg: "acme",
      version: "1.0.0",
    })
  })

  test("parses scoped npm package without version", () => {
    expect(parsePluginSpecifier("@webforge/acme")).toEqual({
      pkg: "@webforge/acme",
      version: "latest",
    })
  })

  test("parses scoped npm package with version", () => {
    expect(parsePluginSpecifier("@webforge/acme@1.0.0")).toEqual({
      pkg: "@webforge/acme",
      version: "1.0.0",
    })
  })

  test("parses package with git+https url", () => {
    expect(parsePluginSpecifier("acme@git+https://github.com/webforge/acme.git")).toEqual({
      pkg: "acme",
      version: "git+https://github.com/webforge/acme.git",
    })
  })

  test("parses scoped package with git+https url", () => {
    expect(parsePluginSpecifier("@webforge/acme@git+https://github.com/webforge/acme.git")).toEqual({
      pkg: "@webforge/acme",
      version: "git+https://github.com/webforge/acme.git",
    })
  })

  test("parses package with git+ssh url containing another @", () => {
    expect(parsePluginSpecifier("acme@git+ssh://git@github.com/webforge/acme.git")).toEqual({
      pkg: "acme",
      version: "git+ssh://git@github.com/webforge/acme.git",
    })
  })

  test("parses scoped package with git+ssh url containing another @", () => {
    expect(parsePluginSpecifier("@webforge/acme@git+ssh://git@github.com/webforge/acme.git")).toEqual({
      pkg: "@webforge/acme",
      version: "git+ssh://git@github.com/webforge/acme.git",
    })
  })

  test("parses unaliased git+ssh url", () => {
    expect(parsePluginSpecifier("git+ssh://git@github.com/webforge/acme.git")).toEqual({
      pkg: "git+ssh://git@github.com/webforge/acme.git",
      version: "",
    })
  })

  test("parses npm alias using the alias name", () => {
    expect(parsePluginSpecifier("acme@npm:@webforge/acme@1.0.0")).toEqual({
      pkg: "acme",
      version: "npm:@webforge/acme@1.0.0",
    })
  })

  test("parses bare npm protocol specifier using the target package", () => {
    expect(parsePluginSpecifier("npm:@webforge/acme@1.0.0")).toEqual({
      pkg: "@webforge/acme",
      version: "1.0.0",
    })
  })

  test("parses unversioned npm protocol specifier", () => {
    expect(parsePluginSpecifier("npm:@webforge/acme")).toEqual({
      pkg: "@webforge/acme",
      version: "latest",
    })
  })
})

import assert from "node:assert/strict";
import test from "node:test";
import type { Setting, SettingDefinitionGroup, SettingDefinitionRender } from "obsidian";

import { SearchableSettingsPageBuilder } from "../src/settingsDefinitionBuilder.ts";

// @lat: [[tests#Searchable Settings Definitions]]
test("settings builder exposes searchable page, group, row, and description metadata", () => {
  const pageBuilder = new SearchableSettingsPageBuilder();
  let componentConfigured = false;

  pageBuilder.group("Redis indexing");
  const settingBuilder = pageBuilder
    .setting()
    .setName("Redis indexing namespace")
    .setDesc("Stable identifier used in Redis index names.")
    .addText(() => {
      componentConfigured = true;
    });

  const page = pageBuilder.page("Maintenance", "Redis recovery and diagnostics.");
  assert.equal(page.type, "page");
  assert.equal(page.name, "Maintenance");
  assert.equal(page.desc, "Redis recovery and diagnostics.");

  const group = page.items?.[0] as SettingDefinitionGroup;
  assert.equal(group.type, "group");
  assert.equal(group.heading, "Redis indexing");

  const definition = group.items?.[0] as SettingDefinitionRender;
  assert.equal(definition.name, "Redis indexing namespace");
  assert.equal(definition.desc, "Stable identifier used in Redis index names.");
  assert.equal(componentConfigured, false, "building search metadata must not render controls");

  const classNames = new Set<string>();
  settingBuilder.toggleClass("is-disabled", true);
  const fakeSetting = {
    settingEl: {
      classList: {
        toggle: (name: string, enabled: boolean) => {
          if (enabled) {
            classNames.add(name);
          } else {
            classNames.delete(name);
          }
        },
      },
    },
    addText: (callback: (component: unknown) => unknown) => {
      callback({});
      return fakeSetting;
    },
  } as unknown as Setting;

  definition.render(fakeSetting, {} as never);
  assert.equal(componentConfigured, true);
  assert.equal(classNames.has("is-disabled"), true);
});

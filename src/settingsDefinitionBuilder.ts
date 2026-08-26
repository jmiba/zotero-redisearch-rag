import type {
  Setting,
  SettingDefinitionGroup,
  SettingDefinitionItem,
  SettingDefinitionPage,
  SettingDefinitionRender,
} from "obsidian";

type SettingRenderer = (setting: Setting) => void;

/**
 * Collects an imperative Setting row as a declarative, searchable definition.
 * Component callbacks are deferred until Obsidian actually renders the row.
 */
export class SearchableSettingBuilder {
  readonly definition: SettingDefinitionRender;
  private readonly renderers: SettingRenderer[] = [];
  private readonly classStates = new Map<string, boolean>();
  private renderedSetting: Setting | null = null;

  constructor(register: (definition: SettingDefinitionRender) => void) {
    this.definition = {
      name: "",
      render: (setting) => {
        this.renderedSetting = setting;
        for (const renderer of this.renderers) {
          renderer(setting);
        }
        for (const [className, enabled] of this.classStates) {
          setting.settingEl.classList.toggle(className, enabled);
        }
      },
    };
    register(this.definition);
  }

  setName(name: string): this {
    this.definition.name = name;
    return this;
  }

  setDesc(desc: string | DocumentFragment): this {
    this.definition.desc = desc;
    return this;
  }

  setVisible(visible: boolean | (() => boolean)): this {
    this.definition.visible = visible;
    return this;
  }

  addClass(className: string): this {
    this.classStates.set(className, true);
    return this;
  }

  toggleClass(className: string, enabled: boolean): this {
    this.classStates.set(className, enabled);
    this.renderedSetting?.settingEl.classList.toggle(className, enabled);
    return this;
  }

  addRender(renderer: SettingRenderer): this {
    this.renderers.push(renderer);
    return this;
  }

  addText(callback: Parameters<Setting["addText"]>[0]): this {
    return this.addRender((setting) => {
      setting.addText(callback);
    });
  }

  addTextArea(callback: Parameters<Setting["addTextArea"]>[0]): this {
    return this.addRender((setting) => {
      setting.addTextArea(callback);
    });
  }

  addToggle(callback: Parameters<Setting["addToggle"]>[0]): this {
    return this.addRender((setting) => {
      setting.addToggle(callback);
    });
  }

  addDropdown(callback: Parameters<Setting["addDropdown"]>[0]): this {
    return this.addRender((setting) => {
      setting.addDropdown(callback);
    });
  }

  addButton(callback: Parameters<Setting["addButton"]>[0]): this {
    return this.addRender((setting) => {
      setting.addButton(callback);
    });
  }

  addSlider(callback: Parameters<Setting["addSlider"]>[0]): this {
    return this.addRender((setting) => {
      setting.addSlider(callback);
    });
  }
}

/** Builds a native Obsidian settings sub-page from searchable groups and rows. */
export class SearchableSettingsPageBuilder {
  private readonly items: SettingDefinitionItem[] = [];
  private currentGroup: SettingDefinitionGroup | null = null;

  group(heading: string): this {
    const group: SettingDefinitionGroup = {
      type: "group",
      heading,
      items: [],
    };
    this.items.push(group);
    this.currentGroup = group;
    return this;
  }

  setting(): SearchableSettingBuilder {
    return new SearchableSettingBuilder((definition) => {
      if (this.currentGroup) {
        this.currentGroup.items?.push(definition);
      } else {
        this.items.push(definition);
      }
    });
  }

  page(name: string, desc: string): SettingDefinitionPage {
    return {
      type: "page",
      name,
      desc,
      items: this.items,
    };
  }
}

import { dump, load } from "js-yaml";
import {
  css,
  CSSResultGroup,
  html,
  LitElement,
  PropertyValues,
  TemplateResult,
} from "lit";
import { property, query, state } from "lit/decorators.js";
import {
  computeRTL,
  deepEqual,
  fireEvent,
  handleStructError,
  HomeAssistant,
  LovelaceCardConfig,
  LovelaceConfig,
} from "../../../ha";

import { GUISupportError } from "./gui-support-error";
import { LovelaceGenericElementEditor } from "./types";

export interface ConfigChangedEvent {
  config: LovelaceCardConfig;
  error?: string;
  guiModeAvailable?: boolean;
}

export interface GUIModeChangedEvent {
  guiMode: boolean;
  guiModeAvailable: boolean;
}

declare global {
  interface HASSDomEvents {
    // @ts-ignore
    "config-changed": ConfigChangedEvent;
    "GUImode-changed": GUIModeChangedEvent;
  }
}

export interface UIConfigChangedEvent extends Event {
  detail: {
    config: LovelaceCardConfig;
  };
}

export abstract class TemplateGaugeElementEditor<T> extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public lovelace?: LovelaceConfig;

  @state() private _yaml?: string;

  @state() private _config?: T;

  @state() private _configElement?: LovelaceGenericElementEditor;

  @state() private _configElementType?: string;

  @state() private _guiMode = true;

  // Error: Configuration broken - do not save
  @state() private _errors?: string[];

  // Warning: GUI editor can't handle configuration - ok to save
  @state() private _warnings?: string[];

  @state() private _guiSupported?: boolean;

  @state() private _loading = false;

  @query("ha-code-editor") _yamlEditor?: any /**HaCodeEditor**/;

  public get yaml(): string {
    if (!this._yaml) {
      this._yaml = dump(this._config);
    }
    return this._yaml || "";
  }

  public set yaml(_yaml: string) {
    this._yaml = _yaml;
    try {
      this._config = load(this.yaml) as any;
      this._errors = undefined;
    } catch (err: any) {
      this._errors = [err.message];
    }
    this._setConfig();
  }

  public get value(): T | undefined {
    return this._config;
  }

  public set value(config: T | undefined) {
    if (this._config && deepEqual(config, this._config)) {
      return;
    }
    this._config = config;
    this._yaml = undefined;
    this._errors = undefined;
    this._setConfig();
  }

  private _setConfig(): void {
    if (!this._errors) {
      try {
        this._updateConfigElement();
      } catch (err: any) {
        this._errors = [err.message];
      }
    }

    fireEvent(this, "config-changed", {
      config: this.value! as any,
      // @ts-ignore
      error: this._errors?.join(", "),
      guiModeAvailable: !(
        this.hasWarning ||
        this.hasError ||
        this._guiSupported === false
      ),
    });
  }

  public get hasWarning(): boolean {
    return this._warnings !== undefined && this._warnings.length > 0;
  }

  public get hasError(): boolean {
    return this._errors !== undefined && this._errors.length > 0;
  }

  public get GUImode(): boolean {
    return this._guiMode;
  }

  public set GUImode(guiMode: boolean) {
    this._guiMode = guiMode;
    fireEvent(this as HTMLElement, "GUImode-changed", {
      guiMode,
      guiModeAvailable: !(
        this.hasWarning ||
        this.hasError ||
        this._guiSupported === false
      ),
    });
  }

  public toggleMode() {
    this.GUImode = !this.GUImode;
  }

  public focusYamlEditor() {
    if (this._configElement?.focusYamlEditor) {
      this._configElement.focusYamlEditor();
    }
    if (!this._yamlEditor?.codemirror) {
      return;
    }
    this._yamlEditor.codemirror.focus();
  }

  protected async getConfigElement(): Promise<
    LovelaceGenericElementEditor | undefined
  > {
    return undefined;
  }

  protected get configElementType(): string | undefined {
    return this.value ? (this.value as any).type : undefined;
  }

  protected render(): TemplateResult {
    return html`
      <div class="wrapper">
        ${this.GUImode
          ? html`
              <div class="gui-editor">
                ${this._loading
                  ? html`
                      <ha-circular-progress
                        active
                        alt="Loading"
                        class="center margin-bot"
                      ></ha-circular-progress>
                    `
                  : this._configElement}
              </div>
            `
          : html`
              <div class="yaml-editor">
                <ha-code-editor
                  mode="yaml"
                  autofocus
                  .value=${this.yaml}
                  .error=${Boolean(this._errors)}
                  .rtl=${computeRTL(this.hass)}
                  @value-changed=${this._handleYAMLChanged}
                  @keydown=${this._ignoreKeydown}
                ></ha-code-editor>
              </div>
            `}
        ${this._guiSupported === false && this.configElementType
          ? html`
              <div class="info">
                ${this.hass.localize(
                  "ui.errors.config.editor_not_available",
                  "type",
                  this.configElementType
                )}
              </div>
            `
          : ""}
        ${this.hasError
          ? html`
              <div class="error">
                ${this.hass.localize("ui.errors.config.error_detected")}:
                <br />
                <ul>
                  ${this._errors!.map((error) => html`<li>${error}</li>`)}
                </ul>
              </div>
            `
          : ""}
        ${this.hasWarning
          ? html`
              <ha-alert
                alert-type="warning"
                .title="${this.hass.localize(
                  "ui.errors.config.editor_not_supported"
                )}:"
              >
                ${this._warnings!.length > 0 && this._warnings![0] !== undefined
                  ? html`
                      <ul>
                        ${this._warnings!.map(
                          (warning) => html`<li>${warning}</li>`
                        )}
                      </ul>
                    `
                  : undefined}
                ${this.hass.localize("ui.errors.config.edit_in_yaml_supported")}
              </ha-alert>
            `
          : ""}
      </div>
    `;
  }

  protected updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);

    if (this._configElement && changedProperties.has("hass")) {
      this._configElement.hass = this.hass;
    }
    if (
      this._configElement &&
      "lovelace" in this._configElement &&
      changedProperties.has("lovelace")
    ) {
      this._configElement.lovelace = this.lovelace;
    }
  }

  private _handleUIConfigChanged(ev: UIConfigChangedEvent) {
    ev.stopPropagation();
    const config = ev.detail.config;
    this.value = config as unknown as T;
  }

  private _handleYAMLChanged(ev: CustomEvent) {
    ev.stopPropagation();
    const newYaml = ev.detail.value;
    if (newYaml !== this.yaml) {
      this.yaml = newYaml;
    }
  }

  private async _updateConfigElement(): Promise<void> {
    if (!this.value) {
      return;
    }

    let configElement: LovelaceGenericElementEditor | undefined;

    try {
      this._errors = undefined;
      this._warnings = undefined;

      if (this._configElementType !== this.configElementType) {
        // If the type has changed, we need to load a new GUI editor
        this._guiSupported = undefined;
        this._configElement = undefined;

        if (!this.configElementType) {
          throw new Error(
            this.hass.localize("ui.errors.config.no_type_provided")
          );
        }

        this._configElementType = this.configElementType;

        this._loading = true;
        configElement = await this.getConfigElement();

        if (configElement) {
          configElement.hass = this.hass;
          if ("lovelace" in configElement) {
            configElement.lovelace = this.lovelace;
          }
          configElement.addEventListener("config-changed", (ev) =>
            this._handleUIConfigChanged(ev as UIConfigChangedEvent)
          );

          this._configElement = configElement;
          this._guiSupported = true;
        }
      }

      if (this._configElement) {
        // Setup GUI editor and check that it can handle the current config
        try {
          this._configElement.setConfig(this.value);
        } catch (err: any) {
          const msgs = handleStructError(this.hass, err);
          throw new GUISupportError(
            "Config is not supported",
            msgs.warnings,
            msgs.errors
          );
        }
      } else {
        this.GUImode = false;
      }
    } catch (err: any) {
      if (err instanceof GUISupportError) {
        this._warnings = err.warnings ?? [err.message];
        this._errors = err.errors || undefined;
      } else {
        this._errors = [err.message];
      }
      this.GUImode = false;
    } finally {
      this._loading = false;
    }
  }

  private _ignoreKeydown(ev: KeyboardEvent) {
    ev.stopPropagation();
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: flex;
      }
      .wrapper {
        width: 100%;
      }
      .gui-editor,
      .yaml-editor {
        padding: 8px 0px;
      }
      ha-code-editor {
        --code-mirror-max-height: calc(100vh - 245px);
      }
      .error,
      .warning,
      .info {
        word-break: break-word;
        margin-top: 8px;
      }
      .error {
        color: var(--error-color);
      }
      .warning {
        color: var(--warning-color);
      }
      .warning ul,
      .error ul {
        margin: 4px 0;
      }
      .warning li,
      .error li {
        white-space: pre-wrap;
      }
      ha-circular-progress {
        display: block;
        margin: auto;
      }
    `;
  }
}

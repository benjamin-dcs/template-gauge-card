import { LitElement } from "lit";
import { html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import memoizeOne from "memoize-one";
import { assert } from "superstruct";
import { HomeAssistant, LovelaceCardEditor, fireEvent } from "../ha";
import setupCustomlocalize from "../localize";
import { computeActionsFormSchema } from "../mushroom/shared/config/actions-config";
import { HaFormSchema } from "../mushroom/utils/form/ha-form";
import { loadHaComponents } from "../mushroom/utils/loader";
import { TEMPLATE_CARD_EDITOR_NAME } from "./const";
import {
  TemplateCardConfig,
  templateCardConfigStruct,
} from "./template-gauge-card-config";

export const CUSTOM_LABELS = [
  "entity",
  "gradient",
  "green",
  "max",
  "min",
  "needle",
  "severity",
  "show_severity",
  "red",
  "value",
  "valueText",
  "yellow",
];

@customElement(TEMPLATE_CARD_EDITOR_NAME)
export class TemplateCardEditor
  extends LitElement
  implements LovelaceCardEditor
{
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: TemplateCardConfig;

  private _schema = memoizeOne(
    (showSeverity: boolean) =>
      [
        {
          name: "entity",
          selector: {
            entity: {
              domain: ["counter", "input_number", "number", "sensor"],
            },
          },
        },
        {
          name: "value",
          selector: { template: {} },
        },
        {
          name: "valueText",
          selector: { template: {} },
        },
        {
          name: "name",
          selector: { template: {} },
        },
        {
          name: "min",
          selector: { template: {} },
        },
        {
          name: "max",
          selector: { template: {} },
        },
        {
          name: "",
          type: "grid",
          schema: [
            { name: "needle", selector: { boolean: {} } },
            { name: "show_severity", selector: { boolean: {} } },
            { name: "gradient", selector: { boolean: {} } },
          ],
        },
        ...(showSeverity
          ? ([
              {
                name: "severity",
                type: "grid",
                schema: [
                  {
                    name: "green",
                    selector: { number: { mode: "box", step: "any" } },
                  },
                  {
                    name: "yellow",
                    selector: { number: { mode: "box", step: "any" } },
                  },
                  {
                    name: "red",
                    selector: { number: { mode: "box", step: "any" } },
                  },
                ],
              },
            ] as const)
          : []),
        ...computeActionsFormSchema(),
      ] as const
  );

  connectedCallback() {
    super.connectedCallback();
    void loadHaComponents();
  }

  public setConfig(config: TemplateCardConfig): void {
    assert(config, templateCardConfigStruct);
    this._config = config;
  }

  private _computeLabel = (schema: HaFormSchema) => {
    const customLocalize = setupCustomlocalize(this.hass!);

    if (schema.name === "entity") {
      return `${this.hass!.localize(
        "ui.panel.lovelace.editor.card.generic.entity"
      )} (${customLocalize("editor.card.template.entity_extra")})`;
    }
    if (CUSTOM_LABELS.includes(schema.name)) {
      return customLocalize(`editor.card.${schema.name}`);
    }
    return this.hass!.localize(
      `ui.panel.lovelace.editor.card.generic.${schema.name}`
    );
  };

  protected render() {
    if (!this.hass || !this._config) {
      return nothing;
    }

    const schema = this._schema(this._config!.severity !== undefined);
    const data = {
      show_severity: this._config!.severity !== undefined,
      ...this._config,
    };

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${schema}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  private _valueChanged(ev: CustomEvent): void {
    let config = ev.detail.value;

    if (config.show_severity) {
      config = {
        ...config,
        severity: {
          green: config.green || config.severity?.green || 0,
          yellow: config.yellow || config.severity?.yellow || 0,
          red: config.red || config.severity?.red || 0,
        },
      };
    } else if (!config.show_severity && config.severity) {
      delete config.severity;
    }

    delete config.show_severity;
    delete config.green;
    delete config.yellow;
    delete config.red;

    fireEvent(this, "config-changed", { config });
  }
}

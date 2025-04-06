import { UnsubscribeFunc } from "home-assistant-js-websocket";
import { css, CSSResultGroup, html, nothing, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import hash from "object-hash/dist/object_hash";
import {
  actionHandler,
  ActionHandlerEvent,
  handleAction,
  hasAction,
  HomeAssistant,
  LovelaceCard,
  LovelaceCardEditor,
  RenderTemplateResult,
  subscribeRenderTemplate,
} from "../ha";
import { TemplateGaugeBaseElement } from "../mushroom/utils/base-element";
import { CacheManager } from "../mushroom/utils/cache-manager";
import { TEMPLATE_CARD_EDITOR_NAME, TEMPLATE_CARD_NAME } from "./const";
import { TemplateCardConfig } from "./template-gauge-card-config";
import "./template-gauge";

const templateCache = new CacheManager<TemplateResults>(1000);

type TemplateResults = Partial<
  Record<TemplateKey, RenderTemplateResult | undefined>
>;

export const DEFAULT_MIN = 0;
export const DEFAULT_MAX = 100;

export const severityMap = {
  red: "var(--error-color)",
  green: "var(--success-color)",
  yellow: "var(--warning-color)",
  normal: "var(--info-color)",
};

const TEMPLATE_KEYS = [
  "value",
  "valueText",
  "name",
  "min",
  "max",
  "segmentsTemplate",
  "severityTemplate",
] as const;
type TemplateKey = (typeof TEMPLATE_KEYS)[number];

@customElement(TEMPLATE_CARD_NAME)
export class TemplateCard
  extends TemplateGaugeBaseElement
  implements LovelaceCard
{
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import("./template-gauge-card-editor");
    return document.createElement(
      TEMPLATE_CARD_EDITOR_NAME
    ) as LovelaceCardEditor;
  }

  public static async getStubConfig(
    _hass: HomeAssistant
  ): Promise<TemplateCardConfig> {
    return {
      type: `custom:${TEMPLATE_CARD_NAME}`,
      value: "{{ (range(0, 200) | random) / 100 -1 }}",
      valueText: "{{ (range(0, 200) | random) }} W",
      min: "-1",
      max: "1",
    };
  }

  @state() private _config?: TemplateCardConfig;

  @state() private _templateResults?: TemplateResults;

  @state() private _unsubRenderTemplates: Map<
    TemplateKey,
    Promise<UnsubscribeFunc>
  > = new Map();

  @property({ reflect: true, type: String })
  public layout: string | undefined;

  public getCardSize(): number {
    return 4;
  }

  setConfig(config: TemplateCardConfig): void {
    TEMPLATE_KEYS.forEach((key) => {
      if (
        this._config?.[key] !== config[key] ||
        this._config?.entity != config.entity
      ) {
        this._tryDisconnectKey(key);
      }
    });
    this._config = {
      tap_action: {
        action: "toggle",
      },
      hold_action: {
        action: "more-info",
      },
      ...config,
    };
  }

  public connectedCallback() {
    super.connectedCallback();
    this._tryConnect();
  }

  public disconnectedCallback() {
    super.disconnectedCallback();
    this._tryDisconnect();

    if (this._config && this._templateResults) {
      const key = this._computeCacheKey();
      templateCache.set(key, this._templateResults);
    }
  }

  private _computeCacheKey() {
    return hash(this._config);
  }

  protected willUpdate(_changedProperties: PropertyValues): void {
    super.willUpdate(_changedProperties);
    if (!this._config) {
      return;
    }

    if (!this._templateResults) {
      const key = this._computeCacheKey();
      if (templateCache.has(key)) {
        this._templateResults = templateCache.get(key)!;
      } else {
        this._templateResults = {};
      }
    }
  }

  private _handleAction(ev: ActionHandlerEvent) {
    handleAction(this, this.hass!, this._config!, ev.detail.action!);
  }

  public isTemplate(key: TemplateKey) {
    const value = this._config?.[key];
    return value?.includes("{");
  }

  private getValue(key: TemplateKey) {
    return this.isTemplate(key)
      ? this._templateResults?.[key]?.result?.toString()
      : this._config?.[key];
  }

  private getSeverity() {
    const severity = this._templateResults?.["severityTemplate"]?.result;
    console.info(severity);

    return severity ? Object(severity) : this._config!.severity;
  }

  private getSegments() {
    const segmentsTemplate =
      this._templateResults?.["segmentsTemplate"]?.result;
    console.info(segmentsTemplate);

    return segmentsTemplate ? Object(segmentsTemplate) : this._config!.segments;
  }

  private _computeSeverity(numberValue: number): string | undefined {
    if (this._config!.needle) {
      return undefined;
    }

    // new format
    let segments = this.getSegments();
    if (segments) {
      segments = [...segments].sort((a, b) => a.from - b.from);

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        if (
          segment &&
          numberValue >= segment.from &&
          (i + 1 === segments.length || numberValue < segments[i + 1]?.from)
        ) {
          return segment.color;
        }
      }
      return severityMap.normal;
    }

    // old format
    const sections = this.getSeverity();

    if (!sections) {
      return severityMap.normal;
    }

    const sectionsArray = Object.keys(sections);
    const sortable = sectionsArray.map((severity) => [
      severity,
      sections[severity],
    ]);

    for (const severity of sortable) {
      if (severityMap[severity[0]] == null || isNaN(severity[1])) {
        return severityMap.normal;
      }
    }
    sortable.sort((a, b) => a[1] - b[1]);

    if (numberValue >= sortable[0][1] && numberValue < sortable[1][1]) {
      return severityMap[sortable[0][0]];
    }
    if (numberValue >= sortable[1][1] && numberValue < sortable[2][1]) {
      return severityMap[sortable[1][0]];
    }
    if (numberValue >= sortable[2][1]) {
      return severityMap[sortable[2][0]];
    }
    return severityMap.normal;
  }

  private _severityLevels() {
    // new format
    const segments = this.getSegments();
    if (segments) {
      return segments.map((segment) => ({
        level: segment?.from,
        stroke: segment?.color,
        label: segment?.label,
      }));
    }

    // old format
    const sections = this.getSeverity();

    if (!sections) {
      return [{ level: 0, stroke: severityMap.normal }];
    }

    const sectionsArray = Object.keys(sections);
    return sectionsArray.map((severity) => ({
      level: sections[severity],
      stroke: severityMap[severity],
    }));
  }

  protected render() {
    if (!this._config || !this.hass) {
      return nothing;
    }

    const value = Boolean(this.getValue("value"))
      ? Number(this.getValue("value"))
      : 0;
    const valueText = Boolean(this.getValue("valueText"))
      ? this.getValue("valueText")
      : "";
    const name = Boolean(this.getValue("name")) ? this.getValue("name") : "";
    const min = Boolean(this.getValue("min"))
      ? Number(this.getValue("min"))
      : DEFAULT_MIN;
    const max = Boolean(this.getValue("max"))
      ? Number(this.getValue("max"))
      : DEFAULT_MAX;

    return html`
      <ha-card
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this._config.hold_action),
          hasDoubleClick: hasAction(this._config.double_tap_action),
        })}
      >
        <template-gauge
          .min=${min}
          .max=${max}
          .value=${value}
          .valueText=${valueText}
          .locale=${this.hass!.locale}
          style=${styleMap({
            "--gauge-color": this._computeSeverity(value),
          })}
          .needle=${this._config!.needle}
          .levels=${this._config!.needle ? this._severityLevels() : undefined}
        ></template-gauge>
        <div class="name" .title=${name}>${name}</div>
      </ha-card>
    `;
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (!this._config || !this.hass) {
      return;
    }

    this._tryConnect();
  }

  private async _tryConnect(): Promise<void> {
    TEMPLATE_KEYS.forEach((key) => {
      this._tryConnectKey(key);
    });
  }

  private async _tryConnectKey(key: TemplateKey): Promise<void> {
    if (
      this._unsubRenderTemplates.get(key) !== undefined ||
      !this.hass ||
      !this._config ||
      !this.isTemplate(key)
    ) {
      return;
    }

    try {
      const sub = subscribeRenderTemplate(
        this.hass.connection,
        (result) => {
          this._templateResults = {
            ...this._templateResults,
            [key]: result,
          };
        },
        {
          template: this._config[key] ?? "",
          entity_ids: this._config.entity_id,
          variables: {
            config: this._config,
            user: this.hass.user!.name,
            entity: this._config.entity,
          },
          strict: true,
        }
      );
      this._unsubRenderTemplates.set(key, sub);
      await sub;
    } catch (_err) {
      const result = {
        result: this._config[key] ?? "",
        listeners: {
          all: false,
          domains: [],
          entities: [],
          time: false,
        },
      };
      this._templateResults = {
        ...this._templateResults,
        [key]: result,
      };
      this._unsubRenderTemplates.delete(key);
    }
  }
  private async _tryDisconnect(): Promise<void> {
    TEMPLATE_KEYS.forEach((key) => {
      this._tryDisconnectKey(key);
    });
  }

  private async _tryDisconnectKey(key: TemplateKey): Promise<void> {
    const unsubRenderTemplate = this._unsubRenderTemplates.get(key);
    if (!unsubRenderTemplate) {
      return;
    }

    try {
      const unsub = await unsubRenderTemplate;
      unsub();
      this._unsubRenderTemplates.delete(key);
    } catch (err: any) {
      if (err.code === "not_found" || err.code === "template_error") {
        // If we get here, the connection was probably already closed. Ignore.
      } else {
        throw err;
      }
    }
  }

  static get styles(): CSSResultGroup {
    return [
      // super.styles,
      // cardStyle,
      css`
        ha-card {
          height: 100%;
          overflow: hidden;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          box-sizing: border-box;
        }

        ha-card.action {
          cursor: pointer;
        }

        ha-card:focus {
          outline: none;
        }

        template-gauge {
          width: 100%;
          max-width: 250px;
        }

        .name {
          text-align: center;
          line-height: initial;
          color: var(--primary-text-color);
          width: 100%;
          font-size: 15px;
          margin-top: 8px;
        }
      `,
    ];
  }
}

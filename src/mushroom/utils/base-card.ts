import { HassEntity } from "home-assistant-js-websocket";
import { property, state } from "lit/decorators.js";
import { HomeAssistant } from "../../ha";
import { EntitySharedConfig } from "../shared/config/entity-config";
import { TemplateGaugeBaseElement } from "./base-element";

type BaseConfig = EntitySharedConfig;

export function computeDarkMode(hass?: HomeAssistant): boolean {
  if (!hass) return false;
  return (hass.themes as any).darkMode as boolean;
}
export class TemplateGaugeBaseCard<
  T extends BaseConfig = BaseConfig,
  E extends HassEntity = HassEntity,
> extends TemplateGaugeBaseElement {
  @state() protected _config?: T;

  @property({ reflect: true, type: String })
  public layout: string | undefined;

  protected get _stateObj(): E | undefined {
    if (!this._config || !this.hass || !this._config.entity) return undefined;

    const entityId = this._config.entity;
    return this.hass.states[entityId] as E;
  }

  protected get hasControls(): boolean {
    return false;
  }

  setConfig(config: T): void {
    this._config = {
      tap_action: {
        action: "more-info",
      },
      hold_action: {
        action: "more-info",
      },
      ...config,
    };
  }

  public getCardSize(): number | Promise<number> {
    return 1;
  }
}

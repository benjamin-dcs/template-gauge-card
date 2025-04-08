import {
  array,
  assign,
  boolean,
  number,
  object,
  optional,
  string,
  union,
} from "superstruct";
import { LovelaceCardConfig } from "../ha";
import { lovelaceCardConfigStruct } from "../mushroom/shared/config/lovelace-card-config";
import { ActionConfig, actionConfigStruct } from "../ha";

const gaugeSegmentStruct = object({
  from: number(),
  color: string(),
});

export type TemplateCardConfig = LovelaceCardConfig & {
  entity?: string;
  value: string;
  valueText?: string;
  name?: string;
  min?: string;
  max?: string;
  needle?: boolean;
  gradient?: boolean;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
  entity_id?: string | string[];
};

export const templateCardConfigStruct = assign(
  lovelaceCardConfigStruct,
  object({
    entity: optional(string()),
    value: optional(string()),
    valueText: optional(string()),
    name: optional(string()),
    min: optional(string()),
    max: optional(string()),
    needle: optional(boolean()),
    gradient: optional(boolean()),
    severity: optional(object()),
    segments: optional(array(gaugeSegmentStruct)),
    tap_action: optional(actionConfigStruct),
    hold_action: optional(actionConfigStruct),
    double_tap_action: optional(actionConfigStruct),
    entity_id: optional(union([string(), array(string())])),
  })
);

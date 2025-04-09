import {
  array,
  assign,
  boolean,
  enums,
  number,
  object,
  optional,
  string,
  union,
} from "superstruct";
import { LovelaceCardConfig } from "../ha";
import { baseLovelaceCardConfig } from "../ha";
import { ActionConfig, actionConfigStruct } from "../ha";

export interface SeverityConfig {
  green?: number;
  yellow?: number;
  red?: number;
}

export interface GaugeSegment {
  from: number;
  color: string;
}

export const gaugeSegmentStruct = object({
  from: number(),
  color: string(),
});

export const gradientResolutionStruct = enums(["low", "medium", "high"]);

export type TemplateCardConfig = LovelaceCardConfig & {
  entity?: string;
  value: string;
  valueText?: string;
  name?: string;
  min?: string;
  max?: string;
  severity?: SeverityConfig;
  needle?: boolean;
  segments?: GaugeSegment[];
  gradient?: boolean;
  gradientResolution?: string;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
  entity_id?: string | string[];
};

export const templateCardConfigStruct = assign(
  baseLovelaceCardConfig,
  object({
    entity: optional(string()),
    value: optional(string()),
    valueText: optional(string()),
    name: optional(string()),
    min: optional(string()),
    max: optional(string()),
    needle: optional(boolean()),
    gradient: optional(boolean()),
    gradientResolution: optional(gradientResolutionStruct),
    severity: optional(object()),
    segments: optional(array(gaugeSegmentStruct)),
    tap_action: optional(actionConfigStruct),
    hold_action: optional(actionConfigStruct),
    double_tap_action: optional(actionConfigStruct),
    entity_id: optional(union([string(), array(string())])),
  })
);

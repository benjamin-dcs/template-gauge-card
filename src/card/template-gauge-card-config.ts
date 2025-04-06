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

export interface SeverityConfig {
  green?: number;
  yellow?: number;
  red?: number;
}

export interface GaugeSegment {
  from: number;
  color: string;
  label?: string;
}

const severityStruct = object({
  green: number(),
  yellow: number(),
  red: number(),
});

const gaugeSegmentStruct = object({
  from: number(),
  color: string(),
  label: optional(string()),
});

export type TemplateCardConfig = LovelaceCardConfig & {
  entity?: string;
  value: string;
  valueText?: string;
  name?: string;
  min?: string;
  max?: string;
  needle?: boolean;
  segments?: GaugeSegment[];
  segmentsTemplate?: string;
  severity?: SeverityConfig;
  severityTemplate?: string;
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
    segments: optional(array(gaugeSegmentStruct)),
    segmentsTemplate: optional(string()),
    severity: optional(severityStruct),
    severityTemplate: optional(string()),
    tap_action: optional(actionConfigStruct),
    hold_action: optional(actionConfigStruct),
    double_tap_action: optional(actionConfigStruct),
    entity_id: optional(union([string(), array(string())])),
  })
);

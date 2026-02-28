import type { ProjectTaskAttributeType } from "@Webapp/api/modules/project";
import React from "react";

export type SelectOptionRow = {
  // 兼容 select 类型（string）与 user 类型（labelInValue 对象）两种写法
  label: string;
  value: string | { value: string; label?: React.ReactNode };
};

export type ColorMapRow = {
  value: string;
  color: string; // hex
};

export type FormValues = {
  attributeName?: string;
  attributeLabel: string;
  attributeType: ProjectTaskAttributeType;
  isRequired: boolean;
  defaultValue?: string;
  order?: number;
  optionsRows?: SelectOptionRow[];
  valueColorMapRows?: ColorMapRow[];
  // user type
  defaultUser?: { label: string; value: string };
};

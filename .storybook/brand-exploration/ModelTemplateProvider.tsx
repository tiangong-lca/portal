import type { ReactNode } from "react";
import {
  ModelTemplateContext,
  type ModelTemplate,
} from "@/components/brand/lifecycle/model-template";

/**
 * Prepares the same independently owned geometry for live stories and frozen review thumbnails.
 * @import import { ModelTemplateProvider } from '../brand-exploration/ModelTemplateProvider';
 */
export function ModelTemplateProvider({
  template,
  children,
}: {
  template?: ModelTemplate;
  children: ReactNode;
}) {
  return <ModelTemplateContext.Provider value={template}>{children}</ModelTemplateContext.Provider>;
}

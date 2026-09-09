import { DatabaseZapIcon } from "lucide-react";
import { PortalPage } from "@/components/shell/portal-page";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CollectionsWorkspace } from "./collections-workspace";
/** @import import { CollectionsPageView } from "@/features/collections/collections-page-view"; */
export function CollectionsPageView(props: Parameters<typeof CollectionsWorkspace>[0]) {
  return (
    <PortalPage title={props.labels.title} description={props.labels.description}>
      <Alert>
        <DatabaseZapIcon aria-hidden="true" />
        <AlertTitle>{props.labels.warningTitle}</AlertTitle>
        <AlertDescription>{props.labels.warningDescription}</AlertDescription>
      </Alert>
      <CollectionsWorkspace {...props} />
    </PortalPage>
  );
}

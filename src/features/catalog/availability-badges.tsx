import { Badge } from "@/components/ui/badge";
import type { DisplayCapabilities } from "./view-model";

export type AvailabilityLabels = { exchanges: string; lcia: string; metadata: string };

export function AvailabilityBadges({
  capabilities,
  labels,
}: {
  capabilities?: DisplayCapabilities;
  labels: AvailabilityLabels;
}) {
  return (
    <>
      {capabilities?.exchangesVisible ? (
        <Badge variant="secondary">{labels.exchanges}</Badge>
      ) : null}
      {capabilities?.lciaVisible ? <Badge variant="secondary">{labels.lcia}</Badge> : null}
      {!capabilities?.exchangesVisible && !capabilities?.lciaVisible ? (
        <Badge variant="outline">{labels.metadata}</Badge>
      ) : null}
    </>
  );
}

/** Production semantic colors and typography in the active Portal theme.
 * @import import { PortalTokens } from "../portal-tokens";
 */
export function PortalTokens() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[
        ["Primary", "bg-primary text-primary-foreground"],
        ["Secondary", "bg-secondary text-secondary-foreground"],
        ["Card", "bg-card text-card-foreground"],
        ["Muted", "bg-muted text-muted-foreground"],
        ["Accent", "bg-accent text-accent-foreground"],
        ["Popover", "bg-popover text-popover-foreground"],
      ].map(([label, className]) => (
        <section className={`rounded-xl border p-6 ${className}`} key={label}>
          <h2 className="font-semibold">{label}</h2>
          <p className="mt-3">天工 LCA · TianGong · Ökobilanz · Électricité</p>
          <p className="mt-2 font-mono text-sm">0.005 kg CO₂ eq</p>
        </section>
      ))}
    </div>
  );
}

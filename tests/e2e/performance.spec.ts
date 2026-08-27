import { expect, test, type Page } from "@playwright/test";

const processRef = "11111111-1111-1111-1111-111111111111@01.00.000";

type Vitals = {
  cls: number;
  inp: number;
  inpSupported: boolean;
  lcp: number;
  ttfb: number;
};

async function installVitalsObserver(page: Page) {
  await page.addInitScript(() => {
    const values = {
      cls: 0,
      inp: 0,
      inpSupported: PerformanceObserver.supportedEntryTypes.includes("event"),
      lcp: 0,
    };
    (window as unknown as { __portalVitals: typeof values }).__portalVitals = values;

    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const latest = entries.at(-1);
      if (latest) values.lcp = latest.startTime;
    }).observe({ buffered: true, type: "largest-contentful-paint" });

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (!shift.hadRecentInput) values.cls += shift.value ?? 0;
      }
    }).observe({ buffered: true, type: "layout-shift" });

    if (values.inpSupported) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) values.inp = Math.max(values.inp, entry.duration);
      }).observe({ durationThreshold: 16, type: "event" } as PerformanceObserverInit);
    }
  });
}

async function collectVitals(page: Page, route: string): Promise<Vitals> {
  await page.goto(route, { waitUntil: "networkidle" });
  await page.getByRole("radio", { name: "Light" }).click();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  return page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0] as
      PerformanceNavigationTiming | undefined;
    const values = (window as unknown as { __portalVitals: Omit<Vitals, "ttfb"> }).__portalVitals;
    return {
      ...values,
      ttfb: navigation ? navigation.responseStart - navigation.startTime : Number.POSITIVE_INFINITY,
    };
  });
}

function percentile(values: number[], fraction: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.ceil(sorted.length * fraction) - 1] ?? Number.POSITIVE_INFINITY;
}

for (const { label, route, ttfbBudget } of [
  { label: "home", route: "/en", ttfbBudget: 800 },
  { label: "cached Process detail", route: `/en/process/${processRef}`, ttfbBudget: 800 },
]) {
  test(`${label} stays inside the local Core Web Vitals guard`, async ({ page }) => {
    await installVitalsObserver(page);
    const samples: Vitals[] = [];
    for (let sample = 0; sample < 4; sample += 1) samples.push(await collectVitals(page, route));

    const evidence = {
      clsP75: percentile(
        samples.map(({ cls }) => cls),
        0.75,
      ),
      inpP75: percentile(
        samples.map(({ inp }) => inp),
        0.75,
      ),
      lcpP75: percentile(
        samples.map(({ lcp }) => lcp),
        0.75,
      ),
      ttfbP75: percentile(
        samples.map(({ ttfb }) => ttfb),
        0.75,
      ),
    };
    console.info(`${label} local CWV p75 ${JSON.stringify(evidence)}`);

    expect(samples.every(({ inpSupported }) => inpSupported)).toBe(true);
    expect(evidence.lcpP75, JSON.stringify(evidence)).toBeGreaterThan(0);
    expect(evidence.lcpP75, JSON.stringify(evidence)).toBeLessThanOrEqual(2500);
    expect(evidence.inpP75, JSON.stringify(evidence)).toBeLessThanOrEqual(200);
    expect(evidence.clsP75, JSON.stringify(evidence)).toBeLessThanOrEqual(0.1);
    expect(evidence.ttfbP75, JSON.stringify(evidence)).toBeLessThanOrEqual(ttfbBudget);
  });
}

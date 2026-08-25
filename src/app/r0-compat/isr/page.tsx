export const revalidate = 60;

export default function R0IsrPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-6 py-12">
      <h1 className="font-heading text-3xl font-semibold">ISR probe</h1>
      <p className="text-muted-foreground">This route revalidates at most once every 60 seconds.</p>
      <p className="font-mono text-sm" data-r0-isr-generated-at>
        {new Date().toISOString()}
      </p>
    </main>
  );
}

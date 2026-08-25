const supportedCapabilities = [
  "Process 与 Flow 公共目录",
  "精确版本、来源与引用信息",
  "公开 Exchanges 与 LCIA 结果",
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-12 px-6 py-16 sm:px-10 lg:px-16">
      <header className="flex flex-col gap-5">
        <p className="font-mono text-sm tracking-[0.18em] uppercase">
          TianGong LCA · Public evidence
        </p>
        <div className="flex max-w-3xl flex-col gap-4">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            公开生命周期数据，从发现到引用。
          </h1>
          <p className="max-w-2xl text-lg leading-8 opacity-75">
            Portal
            正在建立匿名、只读、可验证的数据发现入口。所有展示能力以明确的公共契约和发布证据为准。
          </p>
        </div>
      </header>

      <section
        aria-labelledby="bootstrap-capabilities"
        className="grid gap-px overflow-hidden rounded-md border sm:grid-cols-3"
      >
        <h2 id="bootstrap-capabilities" className="sr-only">
          计划支持的公共能力
        </h2>
        {supportedCapabilities.map((capability, index) => (
          <article className="flex min-h-36 flex-col justify-between gap-8 p-5" key={capability}>
            <span className="font-mono text-sm opacity-55">0{index + 1}</span>
            <p className="font-medium">{capability}</p>
          </article>
        ))}
      </section>

      <footer className="border-t pt-6 text-sm opacity-65">
        Phase 0 · Compatibility and governance bootstrap
      </footer>
    </main>
  );
}

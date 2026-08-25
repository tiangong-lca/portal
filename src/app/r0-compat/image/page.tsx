import Image from "next/image";

export default function R0ImagePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-6 py-12">
      <h1 className="font-heading text-3xl font-semibold">Image optimization probe</h1>
      <Image
        alt="天工 LCA"
        data-r0-optimized-image
        height={128}
        priority
        src="/brand/logo-raster.png"
        width={128}
      />
    </main>
  );
}

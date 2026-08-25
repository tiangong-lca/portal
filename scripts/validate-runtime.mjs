const [major, minor] = process.versions.node.split(".").map(Number);

if (major !== 24 || (minor ?? 0) < 18) {
  throw new Error(
    `Portal requires Node 24.18.x or newer within Node 24; received ${process.version}.`,
  );
}

process.stdout.write(`Portal runtime OK: ${process.version}\n`);

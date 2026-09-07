import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const manifest = JSON.parse(
  await readFile(new URL("../storybook-static/manifests/components.json", import.meta.url), "utf8"),
);
const index = JSON.parse(
  await readFile(new URL("../storybook-static/index.json", import.meta.url), "utf8"),
);
const components = Object.values(manifest.components);
const documentedStories = new Set(
  components.flatMap((component) => component.stories.map((story) => story.id)),
);
for (const story of Object.values(index.entries)) {
  if (story.type === "story" && story.tags.includes("manifest")) {
    assert(documentedStories.has(story.id), `Missing MCP story: ${story.id}`);
  }
}
for (const component of components) {
  for (const entry of [component, ...Object.values(component.subcomponents ?? {})]) {
    assert(
      !entry.error,
      `Invalid component documentation: ${entry.name}: ${JSON.stringify(entry.error)}`,
    );
    assert(entry.import, `Missing import: ${entry.name}`);
    assert(
      !entry.import.includes("@tiangong-lca/portal"),
      `Nonexistent package entrypoint in ${entry.name}`,
    );
  }
}

const button = manifest.components["primitives-button"].reactComponentMeta.props;
assert.match(button.variant.type.name, /"destructive"/);
assert.match(button.size.type.name, /"icon-sm"/);
assert.equal(button.asChild.type.name, "boolean");
const select = manifest.components["primitives-select"];
for (const name of ["value", "defaultValue", "onValueChange", "disabled", "open", "onOpenChange"]) {
  assert(select.reactComponentMeta.props[name], `Select is missing ${name}`);
}
assert.equal(select.reactComponentMeta.props.value.type.name, "string");
const triggerSize = select.subcomponents.SelectTrigger.reactComponentMeta.props.size.type;
assert(triggerSize.name === "enum" && triggerSize.value.some((entry) => entry.value === '"sm"'));
console.log(
  `Validated MCP documentation for ${components.length} component groups and ${documentedStories.size} stories.`,
);

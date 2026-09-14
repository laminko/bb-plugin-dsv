// No backend behaviour: the viewer lives in app.tsx and loads files itself.
// bb.server is a required manifest field, so the factory just logs.
import type { BbPluginApi } from "@get-bb/plugin-sdk";

export default async function plugin(bb: BbPluginApi) {
  bb.log.info("dsv table ready");
}

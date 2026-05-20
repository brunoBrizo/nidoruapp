import { breathTechniques } from "@nidoru/domain";

import { TabEntryScreen } from "../../shell/tab-entry-screen";

export default function BreatheTabScreen() {
  return (
    <TabEntryScreen
      title="Breathe"
      description="Technique anchors grouped by state, with full sessions added later."
      sections={[
        {
          title: "Sleep",
          entries: [
            {
              label: breathTechniques["4-7-8-sleep"].name,
              description: breathTechniques["4-7-8-sleep"].primaryContext,
              href: "/breathe/4-7-8-sleep",
            },
          ],
        },
        {
          title: "Calm",
          entries: [
            {
              label: breathTechniques["coherent-breathing"].name,
              description: breathTechniques["coherent-breathing"].primaryContext,
              href: "/breathe/coherent-breathing",
            },
            {
              label: breathTechniques["physiological-sigh"].name,
              description: breathTechniques["physiological-sigh"].primaryContext,
              href: "/breathe/physiological-sigh",
            },
          ],
        },
        {
          title: "Energy",
          entries: [
            {
              label: "Morning Breathwork",
              description: "Short energizing session anchor.",
              href: "/breathe/morning",
            },
          ],
        },
        {
          title: "Focus",
          entries: [
            {
              label: breathTechniques["box-breathing"].name,
              description: breathTechniques["box-breathing"].primaryContext,
              href: "/breathe/box-breathing",
            },
          ],
        },
      ]}
    />
  );
}

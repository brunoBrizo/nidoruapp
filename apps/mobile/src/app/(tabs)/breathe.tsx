import { breathTechniques } from "@nidoru/domain";

import { TabEntryScreen } from "../../shell/tab-entry-screen";

export default function BreatheTabScreen() {
  const dailyCalmDescription = `${breathTechniques["coherent-breathing"].primaryContext} · 10 min · 5.5s in / 5.5s out`;

  return (
    <TabEntryScreen
      title="Breathe"
      description="Regular breathing practices grouped by state."
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
              label: `${breathTechniques["coherent-breathing"].name} / Daily Calm`,
              description: dailyCalmDescription,
              href: "/breathe/coherent-breathing?durationSeconds=600",
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

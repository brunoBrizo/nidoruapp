import { TabEntryScreen } from "../../shell/tab-entry-screen";

export default function ProgressTabScreen() {
  return (
    <TabEntryScreen
      title="Progress"
      description="Compassionate progress anchors without streak pressure."
      sections={[
        {
          entries: [
            {
              label: "Streak Calendar",
              description: "Weekly rhythm view with pause-friendly tracking.",
              href: "/progress/streak-calendar",
            },
            {
              label: "Weekly Summary",
              description: "A calm recap of sessions and sleep patterns.",
              href: "/progress/weekly-summary",
            },
            {
              label: "Mood History",
              description: "Future check-in trend anchor.",
              href: "/progress/mood-history",
            },
            {
              label: "Sleep Trends",
              description: "Sleep quality trend anchor.",
              href: "/progress/sleep-trends",
            },
          ],
        },
      ]}
    />
  );
}

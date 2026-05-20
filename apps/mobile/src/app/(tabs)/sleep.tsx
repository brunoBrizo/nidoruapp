import { TabEntryScreen } from "../../shell/tab-entry-screen";

export default function SleepTabScreen() {
  return (
    <TabEntryScreen
      title="Sleep"
      description="Quiet anchors for bedtime routines and sleep audio."
      sections={[
        {
          entries: [
            {
              label: "Wind-Down Flow",
              description: "Guided breathwork and sleep sound sequence.",
              href: "/sleep/wind-down",
            },
            {
              label: "Sound Mixer",
              description: "Rain, noise, and ambience controls.",
              href: "/sleep/sounds",
            },
            {
              label: "Sleep Stories when added",
              description: "Future low-stimulation story anchor.",
              href: "/sleep/stories",
            },
          ],
        },
      ]}
    />
  );
}

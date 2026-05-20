import { TabEntryScreen } from "../../shell/tab-entry-screen";

export default function ProfileTabScreen() {
  return (
    <TabEntryScreen
      title="Profile"
      description="Account and preference anchors kept visible without invoking real services."
      sections={[
        {
          entries: [
            {
              label: "Settings",
              description: "Account and app settings placeholder.",
              href: "/profile/settings",
            },
            {
              label: "Subscription",
              description: "Plan details placeholder.",
              href: "/profile/subscription",
            },
            {
              label: "Cancel Subscription",
              description: "Cancellation path placeholder within three taps from Home.",
              href: "/profile/subscription/cancel",
            },
            {
              label: "Notifications",
              description: "Reminder preferences placeholder.",
              href: "/profile/notifications",
            },
            {
              label: "Sound Preferences",
              description: "Audio defaults placeholder.",
              href: "/profile/sound-preferences",
            },
            {
              label: "Support",
              description: "Help and support placeholder.",
              href: "/profile/support",
            },
            {
              label: "Privacy Controls",
              description: "Privacy and data controls placeholder.",
              href: "/profile/privacy",
            },
          ],
        },
      ]}
    />
  );
}

import { breathTechniques, launchSoundIds } from "@nidoru/domain";
import { messages } from "@nidoru/i18n";
import { colors, motion, radii, spacing, typography } from "@nidoru/ui-tokens";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const firstTechnique = breathTechniques["4-7-8-sleep"];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.kicker}>{messages.en.common.appName}</Text>
        <Text style={styles.title}>{messages.en.session.firstValueTitle}</Text>
        <Text style={styles.body}>
          {firstTechnique.name} is available with {firstTechnique.phases.length} phases,{" "}
          {launchSoundIds.length} launch sounds, and {motion.duration.screenEnterMs} ms calm
          entrance motion.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.dark.background.value,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.screenPadding,
  },
  kicker: {
    color: colors.dark.accent.value,
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.scale.label.size,
    fontWeight: "700",
    letterSpacing: 0,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  title: {
    color: colors.dark.textPrimary.value,
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.scale.display.size,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 38,
    marginBottom: 16,
  },
  body: {
    backgroundColor: colors.dark.surface.value,
    borderRadius: radii.card,
    color: colors.dark.textSecondary.value,
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.scale.bodyLarge.size,
    lineHeight: 24,
    padding: spacing.sm,
  },
});

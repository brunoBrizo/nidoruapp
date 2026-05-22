import { colors, spacing, typography } from "@nidoru/ui-tokens";
import { StatusBar } from "expo-status-bar";
import { CheckCircle, ShieldCheck } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type {
  PostRewardPaywallEligibility,
  PostValueAuthProvider,
  PostValuePlanId,
} from "./post-value-account-linking";

export type PostValueAccountPaywallScreenProps = {
  readonly accessState: PostRewardPaywallEligibility;
  readonly onContinueFree?: () => void;
  readonly onLinkAccount?: (provider: Exclude<PostValueAuthProvider, "anonymous">) => Promise<void>;
  readonly onRestorePurchase?: () => Promise<void>;
  readonly onStartTrial?: (planId: PostValuePlanId) => Promise<void>;
};

const premiumBenefits = [
  "Unlimited sleep sessions and breath techniques",
  "Full sound library for wind-downs and late nights",
  "Sleep insights as your first two weeks fill in",
] as const;

export function PostValueAccountPaywallScreen({
  accessState,
  onContinueFree = () => undefined,
  onLinkAccount = async () => undefined,
  onRestorePurchase = async () => undefined,
  onStartTrial = async () => undefined,
}: PostValueAccountPaywallScreenProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<PostValuePlanId>("annual");
  const [plansPresented, setPlansPresented] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | undefined>();
  const [actionMessage, setActionMessage] = useState<string | undefined>();
  const shouldShowPlanSelection = accessState.canShowPaywall && plansPresented;

  const handleAccountLinkPress = useCallback(
    (provider: Exclude<PostValueAuthProvider, "anonymous">) => {
      setPendingAction(provider);
      setActionMessage(undefined);
      void onLinkAccount(provider)
        .then(() => {
          setActionMessage("Your progress is linked.");
        })
        .catch(() => {
          setActionMessage("We couldn’t connect right now. Tonight’s session stays saved here.");
        })
        .finally(() => {
          setPendingAction(undefined);
        });
    },
    [onLinkAccount],
  );

  const handleStartTrialPress = useCallback(() => {
    setPendingAction("trial");
    setActionMessage(undefined);
    void onStartTrial(selectedPlanId)
      .catch(() => {
        setActionMessage("Trial checkout is unavailable. You can keep using the free path.");
      })
      .finally(() => {
        setPendingAction(undefined);
      });
  }, [onStartTrial, selectedPlanId]);

  const handleRestorePress = useCallback(() => {
    setPendingAction("restore");
    setActionMessage(undefined);
    void onRestorePurchase()
      .then(() => {
        setActionMessage("Purchases restored.");
      })
      .catch(() => {
        setActionMessage("Restore is unavailable right now. Your local progress is unchanged.");
      })
      .finally(() => {
        setPendingAction(undefined);
      });
  }, [onRestorePurchase]);

  const ctaLabel = plansPresented ? "Start 14-day free trial" : "See plans";
  const ctaHelper = plansPresented ? "No payment now" : "Plans shown before trial starts.";

  if (accessState.status === "blocked") {
    return <BlockedPostValueGate reason={accessState.reason} />;
  }

  return (
    <View style={styles.screen}>
      <StatusBar hidden />
      <View pointerEvents="none" style={styles.ambientGlow} />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          shouldShowPlanSelection ? styles.planScrollContent : styles.accountScrollContent,
        ]}
        contentInsetAdjustmentBehavior="never"
        style={styles.scrollView}
      >
        {!shouldShowPlanSelection ? (
          <>
            <View style={styles.proofLabelRow}>
              <CheckCircle color="#0D0F1A" fill="#5EC4D4" size={14} strokeWidth={3} />
              <Text selectable style={styles.proofLabelText}>
                First session complete
              </Text>
            </View>

            <Text accessibilityRole="header" selectable style={styles.headline}>
              Keep tonight’s calm going
            </Text>
            <Text selectable style={styles.subcopy}>
              Tonight’s session is saved on this phone. Link an account to protect your progress and
              restore it later.
            </Text>

            <View style={styles.proofCard}>
              <ProofMetric label="Session" value={accessState.proof.durationLabel} />
              <View style={styles.proofDivider} />
              <ProofMetric label="Breaths" value={`${accessState.proof.breathCount}`} />
              <View style={styles.proofDivider} />
              <ProofMetric accent label="Streak" value={`${accessState.proof.streakCount}`} />
            </View>

            <View style={styles.accountSection}>
              <Text selectable style={styles.sectionKicker}>
                Save tonight’s progress
              </Text>
              <AccountButton
                disabled={pendingAction === "apple"}
                label="Continue with Apple"
                mark="apple"
                onPress={() => {
                  handleAccountLinkPress("apple");
                }}
              />
              <AccountButton
                disabled={pendingAction === "google"}
                label="Continue with Google"
                mark="google"
                onPress={() => {
                  handleAccountLinkPress("google");
                }}
              />
              <Text selectable style={styles.trustLine}>
                Used for progress sync, purchase restore, and data controls.
              </Text>
              {actionMessage ? (
                <Text accessibilityRole="alert" selectable style={styles.actionMessage}>
                  {actionMessage}
                </Text>
              ) : null}
            </View>
          </>
        ) : null}

        {shouldShowPlanSelection ? (
          <View style={styles.premiumSection}>
            <Text accessibilityRole="header" selectable style={styles.premiumTitle}>
              Try 14 days of Nidoru Premium
            </Text>
            <Text selectable style={styles.premiumCopy}>
              Build on the routine that helped tonight.
            </Text>

            <View style={styles.benefitList}>
              {premiumBenefits.map((benefit) => (
                <View key={benefit} style={styles.benefitRow}>
                  <CheckCircle color="#A89CE0" size={18} />
                  <Text selectable style={styles.benefitText}>
                    {benefit}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.planList}>
              <PlanButton
                badge="BEST VALUE"
                id="annual"
                isSelected={selectedPlanId === "annual"}
                price="$39.99"
                subcopy="14 days free"
                suffix="/ year"
                title="Annual"
                onPress={setSelectedPlanId}
              />
              <PlanButton
                id="monthly"
                isSelected={selectedPlanId === "monthly"}
                price="$7.99"
                subcopy="14 days free"
                suffix="/ month"
                title="Monthly"
                onPress={setSelectedPlanId}
              />
            </View>
            <Text selectable style={styles.termsText}>
              14 days free. Then $39.99/year unless canceled.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.stickyFooter}>
        {accessState.canShowPaywall ? (
          <>
            <Pressable
              accessibilityRole="button"
              disabled={pendingAction === "trial"}
              onPress={() => {
                if (!plansPresented) {
                  setPlansPresented(true);
                  return;
                }

                handleStartTrialPress();
              }}
              style={({ pressed }) => [
                styles.primaryCta,
                pressed ? styles.pressed : null,
                pendingAction === "trial" ? styles.disabled : null,
              ]}
            >
              <Text selectable={false} style={styles.primaryCtaText}>
                {ctaLabel}
              </Text>
            </Pressable>
            <Text selectable style={styles.ctaHelper}>
              {ctaHelper}
            </Text>
          </>
        ) : null}

        {accessState.canContinueFree ? (
          <Pressable
            accessibilityRole="button"
            onPress={onContinueFree}
            style={({ pressed }) => [styles.freeButton, pressed ? styles.pressed : null]}
          >
            <Text selectable={false} style={styles.freeButtonText}>
              Continue with free
            </Text>
          </Pressable>
        ) : null}

        {accessState.canShowPaywall && plansPresented ? (
          <Pressable
            accessibilityRole="button"
            disabled={pendingAction === "restore"}
            onPress={handleRestorePress}
            style={({ pressed }) => [styles.restoreButton, pressed ? styles.pressed : null]}
          >
            <Text selectable={false} style={styles.restoreButtonText}>
              Restore purchase
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function BlockedPostValueGate({ reason }: { readonly reason: string }) {
  const copy = useMemo(() => {
    if (reason === "first_session_required") {
      return "Complete your first session before account linking.";
    }

    return "Finish the first session reward first.";
  }, [reason]);

  return (
    <View style={styles.blockedScreen}>
      <ShieldCheck color="#5EC4D4" size={24} />
      <Text accessibilityRole="header" selectable style={styles.blockedTitle}>
        Not yet
      </Text>
      <Text selectable style={styles.blockedCopy}>
        {copy}
      </Text>
    </View>
  );
}

function ProofMetric({
  accent = false,
  label,
  value,
}: {
  readonly accent?: boolean;
  readonly label: string;
  readonly value: string;
}) {
  return (
    <View style={styles.proofMetric}>
      <Text selectable style={[styles.proofValue, accent ? styles.proofValueAccent : null]}>
        {value}
      </Text>
      <Text selectable style={styles.proofMetricLabel}>
        {label}
      </Text>
    </View>
  );
}

function AccountButton({
  disabled,
  label,
  mark,
  onPress,
}: {
  readonly disabled: boolean;
  readonly label: string;
  readonly mark: "apple" | "google";
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.accountButton,
        mark === "apple" ? styles.appleButton : styles.googleButton,
        pressed ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <Text selectable={false} style={mark === "apple" ? styles.appleMark : styles.googleMark}>
        {mark === "apple" ? "" : "G"}
      </Text>
      <Text selectable={false} style={styles.accountButtonText}>
        {label}
      </Text>
    </Pressable>
  );
}

function PlanButton({
  badge,
  id,
  isSelected,
  onPress,
  price,
  subcopy,
  suffix,
  title,
}: {
  readonly badge?: string;
  readonly id: PostValuePlanId;
  readonly isSelected: boolean;
  readonly onPress: (planId: PostValuePlanId) => void;
  readonly price: string;
  readonly subcopy: string;
  readonly suffix: string;
  readonly title: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={() => {
        onPress(id);
      }}
      style={({ pressed }) => [
        styles.planButton,
        isSelected ? styles.planButtonSelected : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {badge ? (
        <View style={styles.planBadge}>
          <Text selectable={false} style={styles.planBadgeText}>
            {badge}
          </Text>
        </View>
      ) : null}
      <View style={styles.planLeft}>
        <View style={[styles.planRadio, isSelected ? styles.planRadioSelected : null]}>
          {isSelected ? <View style={styles.planRadioDot} /> : null}
        </View>
        <View>
          <Text selectable style={styles.planTitle}>
            {title}
          </Text>
          <Text
            selectable
            style={[styles.planSubcopy, isSelected ? styles.planSubcopyAccent : null]}
          >
            {subcopy}
          </Text>
        </View>
      </View>
      <View style={styles.planPriceWrap}>
        <Text selectable style={styles.planPrice}>
          {price}
        </Text>
        <Text selectable style={styles.planSuffix}>
          {suffix}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  accountButton: {
    alignItems: "center",
    borderRadius: 16,
    flexDirection: "row",
    gap: 10,
    height: 52,
    justifyContent: "center",
    width: "100%",
  },
  accountButtonText: {
    color: "#EEF0FF",
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 15,
  },
  accountScrollContent: {
    paddingTop: 62,
  },
  accountSection: {
    gap: 12,
    marginBottom: 96,
  },
  actionMessage: {
    color: "#A89CE0",
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  ambientGlow: {
    backgroundColor: "rgba(124, 111, 205, 0.13)",
    borderRadius: 180,
    height: 360,
    left: -45,
    position: "absolute",
    top: -100,
    width: 360,
  },
  appleButton: {
    backgroundColor: "#1C2040",
  },
  appleMark: {
    color: "#EEF0FF",
    fontSize: 18,
  },
  benefitList: {
    gap: 14,
    marginBottom: 48,
  },
  benefitRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
  },
  benefitText: {
    color: "#EEF0FF",
    flex: 1,
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 15,
    lineHeight: 21,
  },
  blockedCopy: {
    color: "#8A8FA8",
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  blockedScreen: {
    alignItems: "center",
    backgroundColor: "#0D0F1A",
    flex: 1,
    gap: spacing.sm,
    justifyContent: "center",
    padding: spacing.xl,
  },
  blockedTitle: {
    color: "#EEF0FF",
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 24,
  },
  ctaHelper: {
    color: "#A89CE0",
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 12,
    marginBottom: 16,
    marginTop: 6,
    textAlign: "center",
  },
  disabled: {
    opacity: 0.55,
  },
  freeButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingVertical: 12,
  },
  freeButtonText: {
    color: "#8A8FA8",
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 15,
  },
  googleButton: {
    backgroundColor: "#14172B",
    borderColor: "#1C2040",
    borderWidth: 1,
  },
  googleMark: {
    color: "#5EC4D4",
    fontFamily: typography.mobileFontFamily.data.regular,
    fontSize: 18,
  },
  headline: {
    color: "#EEF0FF",
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 28,
    letterSpacing: 0,
    lineHeight: 34,
    marginBottom: 12,
  },
  planBadge: {
    backgroundColor: "#7C6FCD",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    position: "absolute",
    right: 22,
    top: -11,
  },
  planBadgeText: {
    color: "#EEF0FF",
    fontFamily: typography.mobileFontFamily.data.regular,
    fontSize: 11,
    fontWeight: "700",
  },
  planScrollContent: {
    paddingTop: 64,
  },
  planButton: {
    alignItems: "center",
    backgroundColor: "#14172B",
    borderColor: "#1C2040",
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 70,
    padding: 16,
  },
  planButtonSelected: {
    backgroundColor: "rgba(124, 111, 205, 0.10)",
    borderColor: "#7C6FCD",
  },
  planLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  planList: {
    gap: 12,
    marginBottom: 22,
  },
  planPrice: {
    color: "#EEF0FF",
    fontFamily: typography.mobileFontFamily.data.regular,
    fontSize: 16,
    fontWeight: "700",
  },
  planPriceWrap: {
    alignItems: "flex-end",
  },
  planRadio: {
    alignItems: "center",
    borderColor: "#4A4E6A",
    borderRadius: 10,
    borderWidth: 1.5,
    height: 20,
    justifyContent: "center",
    width: 20,
  },
  planRadioDot: {
    backgroundColor: "#7C6FCD",
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  planRadioSelected: {
    borderColor: "#7C6FCD",
  },
  planSubcopy: {
    color: "#8A8FA8",
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 13,
    marginTop: 3,
  },
  planSubcopyAccent: {
    color: "#A89CE0",
  },
  planSuffix: {
    color: "#8A8FA8",
    fontFamily: typography.mobileFontFamily.data.regular,
    fontSize: 13,
    marginTop: 3,
  },
  planTitle: {
    color: "#EEF0FF",
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 16,
  },
  premiumCopy: {
    color: "#8A8FA8",
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 26,
  },
  premiumSection: {
    marginBottom: 160,
  },
  premiumTitle: {
    color: "#EEF0FF",
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 20,
    letterSpacing: 0,
    lineHeight: 26,
    marginBottom: 8,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
  primaryCta: {
    alignItems: "center",
    backgroundColor: "#7C6FCD",
    borderRadius: 16,
    height: 56,
    justifyContent: "center",
    width: "100%",
  },
  primaryCtaText: {
    color: "#EEF0FF",
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 16,
  },
  proofCard: {
    alignItems: "center",
    backgroundColor: "#14172B",
    borderColor: "#1C2040",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 38,
    minHeight: 72,
    paddingVertical: 14,
  },
  proofDivider: {
    alignSelf: "stretch",
    backgroundColor: "#1C2040",
    width: 1,
  },
  proofLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  proofLabelText: {
    color: "#A4AAC4",
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 13,
  },
  proofMetric: {
    alignItems: "center",
    flex: 1,
    gap: 4,
  },
  proofMetricLabel: {
    color: "#8A8FA8",
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 12,
  },
  proofValue: {
    color: "#EEF0FF",
    fontFamily: typography.mobileFontFamily.data.regular,
    fontSize: 15,
    fontWeight: "700",
  },
  proofValueAccent: {
    color: "#5EC4D4",
  },
  restoreButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  restoreButtonText: {
    color: "#6A6F93",
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 13,
  },
  screen: {
    backgroundColor: colors.dark.background.value,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 360,
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  sectionKicker: {
    color: "#EEF0FF",
    fontFamily: typography.mobileFontFamily.primary.semiBold,
    fontSize: 15,
    marginBottom: 4,
  },
  stickyFooter: {
    backgroundColor: "#0D0F1A",
    bottom: 0,
    left: 0,
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 24,
    position: "absolute",
    right: 0,
  },
  subcopy: {
    color: "#8A8FA8",
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 28,
  },
  termsText: {
    color: "#6A6F93",
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  trustLine: {
    color: "#8A8FA8",
    fontFamily: typography.mobileFontFamily.primary.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
    textAlign: "center",
  },
});

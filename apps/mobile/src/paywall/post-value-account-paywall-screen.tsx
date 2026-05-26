import { StatusBar } from "expo-status-bar";
import { CheckCircle, ShieldCheck } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import { Pressable, ScrollView, Text, View, cn } from "../tw";
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
    <View className="flex-1 bg-[#0D0F1A]" testID="post-value-account-paywall-screen">
      <StatusBar hidden />
      <PaywallTopFade />
      <ScrollView
        className="flex-1"
        contentContainerClassName={cn(
          "px-nidoru-screen pb-[360px]",
          shouldShowPlanSelection ? "pt-16" : "pt-[62px]",
        )}
        contentInsetAdjustmentBehavior="never"
      >
        {!shouldShowPlanSelection ? (
          <>
            <View className="mb-4 flex-row items-center gap-2">
              <CheckCircle color="#0D0F1A" fill="#5EC4D4" size={14} strokeWidth={3} />
              <Text
                className="font-nidoru-primary-semibold text-[13px] leading-[18px] text-[#A4AAC4]"
                selectable
              >
                First session complete
              </Text>
            </View>

            <Text
              accessibilityRole="header"
              className="mb-3 font-nidoru-primary-semibold text-[28px] leading-[34px] tracking-normal text-[#EEF0FF]"
              selectable
            >
              Keep tonight’s calm going
            </Text>
            <Text
              className="mb-7 font-nidoru-primary-regular text-[15px] leading-6 text-[#8A8FA8]"
              selectable
            >
              Tonight’s session is saved on this phone. Link an account to protect your progress and
              restore it later.
            </Text>

            <View className="mb-[38px] min-h-[72px] flex-row items-center justify-between rounded-[16px] border border-[#1C2040] bg-[#14172B] py-3.5">
              <ProofMetric label="Session" value={accessState.proof.durationLabel} />
              <View className="self-stretch bg-[#1C2040] w-px" />
              <ProofMetric label="Breaths" value={`${accessState.proof.breathCount}`} />
              <View className="self-stretch bg-[#1C2040] w-px" />
              <ProofMetric accent label="Streak" value={`${accessState.proof.streakCount}`} />
            </View>

            <View className="mb-24 gap-3" testID="post-value-account-section">
              <Text
                className="mb-1 font-nidoru-primary-semibold text-[15px] leading-5 text-[#EEF0FF]"
                selectable
              >
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
              <Text
                className="mt-0.5 text-center font-nidoru-primary-regular text-[13px] leading-[18px] text-[#8A8FA8]"
                selectable
              >
                Used for progress sync, purchase restore, and data controls.
              </Text>
              {actionMessage ? (
                <Text
                  accessibilityRole="alert"
                  className="text-center font-nidoru-primary-semibold text-[13px] leading-[18px] text-[#A89CE0]"
                  selectable
                >
                  {actionMessage}
                </Text>
              ) : null}
            </View>
          </>
        ) : null}

        {shouldShowPlanSelection ? (
          <View className="mb-40">
            <Text
              accessibilityRole="header"
              className="mb-2 font-nidoru-primary-semibold text-xl leading-[26px] tracking-normal text-[#EEF0FF]"
              selectable
            >
              Try 14 days of Nidoru Premium
            </Text>
            <Text
              className="mb-[26px] font-nidoru-primary-regular text-[15px] leading-[22px] text-[#8A8FA8]"
              selectable
            >
              Build on the routine that helped tonight.
            </Text>

            <View className="mb-12 gap-3.5">
              {premiumBenefits.map((benefit) => (
                <View className="flex-row items-start gap-3" key={benefit}>
                  <CheckCircle color="#A89CE0" size={18} />
                  <Text
                    className="flex-1 font-nidoru-primary-regular text-[15px] leading-[21px] text-[#EEF0FF]"
                    selectable
                  >
                    {benefit}
                  </Text>
                </View>
              ))}
            </View>

            <View className="mb-[22px] gap-3" testID="post-value-plan-list">
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
            <Text
              className="text-center font-nidoru-primary-regular text-[13px] leading-[18px] text-[#6A6F93]"
              selectable
            >
              14 days free. Then $39.99/year unless canceled.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-[260px] bg-gradient-to-t from-[#0D0F1A] via-[#0D0F1A]/95 to-transparent"
        pointerEvents="none"
      />
      <View
        className="absolute bottom-0 left-0 right-0 bg-[#0D0F1A] px-nidoru-screen pb-8 pt-6"
        testID="post-value-sticky-footer"
      >
        {accessState.canShowPaywall ? (
          <>
            <Pressable
              accessibilityRole="button"
              className={cn(
                "h-14 w-full items-center justify-center rounded-[16px] bg-[#7C6FCD] shadow-[0_4px_24px_rgba(124,111,205,0.25)] active:scale-[0.96] active:bg-[#685BB3]",
                pendingAction === "trial" ? "opacity-55" : null,
              )}
              disabled={pendingAction === "trial"}
              onPress={() => {
                if (!plansPresented) {
                  setPlansPresented(true);
                  return;
                }

                handleStartTrialPress();
              }}
            >
              <Text
                className="font-nidoru-primary-semibold text-base leading-[22px] text-[#EEF0FF]"
                selectable={false}
              >
                {ctaLabel}
              </Text>
            </Pressable>
            <Text
              className="mb-4 mt-1.5 text-center font-nidoru-primary-semibold text-xs leading-4 text-[#A89CE0]"
              selectable
            >
              {ctaHelper}
            </Text>
          </>
        ) : null}

        {accessState.canContinueFree ? (
          <Pressable
            accessibilityRole="button"
            className="min-h-11 items-center justify-center py-3 active:scale-[0.96]"
            onPress={onContinueFree}
          >
            <Text
              className="font-nidoru-primary-semibold text-[15px] leading-5 text-[#8A8FA8]"
              selectable={false}
            >
              Continue with free
            </Text>
          </Pressable>
        ) : null}

        {accessState.canShowPaywall && plansPresented ? (
          <Pressable
            accessibilityRole="button"
            className={cn(
              "min-h-11 items-center justify-center active:scale-[0.96]",
              pendingAction === "restore" ? "opacity-55" : null,
            )}
            disabled={pendingAction === "restore"}
            onPress={handleRestorePress}
          >
            <Text
              className="font-nidoru-primary-semibold text-[13px] leading-[18px] text-[#6A6F93]"
              selectable={false}
            >
              Restore purchase
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function PaywallTopFade() {
  return (
    <View className="absolute inset-0" pointerEvents="none" testID="post-value-paywall-top-fade">
      <Svg height="100%" preserveAspectRatio="none" viewBox="0 0 390 760" width="100%">
        <Defs>
          <RadialGradient
            cx="184"
            cy="-20"
            fx="184"
            fy="-20"
            gradientUnits="userSpaceOnUse"
            id="post-value-top-fade"
            r="360"
          >
            <Stop offset="0" stopColor="#A89CE0" stopOpacity="0.13" />
            <Stop offset="0.24" stopColor="#7C6FCD" stopOpacity="0.07" />
            <Stop offset="0.56" stopColor="#1C2040" stopOpacity="0.035" />
            <Stop offset="1" stopColor="#0D0F1A" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect fill="url(#post-value-top-fade)" height="760" width="390" x="0" y="0" />
      </Svg>
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
    <View className="flex-1 items-center justify-center gap-4 bg-[#0D0F1A] p-10">
      <ShieldCheck color="#5EC4D4" size={24} />
      <Text
        accessibilityRole="header"
        className="font-nidoru-primary-semibold text-2xl leading-8 text-[#EEF0FF]"
        selectable
      >
        Not yet
      </Text>
      <Text
        className="text-center font-nidoru-primary-regular text-[15px] leading-[22px] text-[#8A8FA8]"
        selectable
      >
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
    <View className="flex-1 items-center gap-1">
      <Text
        className={cn(
          "font-nidoru-data-regular text-[15px] font-bold leading-5 text-[#EEF0FF]",
          accent ? "text-[#5EC4D4]" : null,
        )}
        selectable
      >
        {value}
      </Text>
      <Text className="font-nidoru-primary-semibold text-xs leading-4 text-[#8A8FA8]" selectable>
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
      className={cn(
        "h-[52px] w-full flex-row items-center justify-center gap-2.5 rounded-[16px] active:scale-[0.98]",
        mark === "apple"
          ? "bg-[#1C2040] active:bg-[#252A50]"
          : "border border-[#1C2040] bg-[#14172B] active:bg-[#1C2040]",
        disabled ? "opacity-55" : null,
      )}
      disabled={disabled}
      onPress={onPress}
    >
      <Text
        className={cn(
          "text-lg leading-6",
          mark === "apple" ? "text-[#EEF0FF]" : "font-nidoru-data-regular text-[#5EC4D4]",
        )}
        selectable={false}
      >
        {mark === "apple" ? "" : "G"}
      </Text>
      <Text
        className="font-nidoru-primary-semibold text-[15px] leading-5 text-[#EEF0FF]"
        selectable={false}
      >
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
      className={cn(
        "relative min-h-[70px] w-full flex-row items-center justify-between rounded-[16px] border-[1.5px] p-4 active:scale-[0.98]",
        isSelected ? "border-[#7C6FCD] bg-[#7C6FCD]/10" : "border-[#1C2040] bg-[#14172B]",
      )}
      onPress={() => {
        onPress(id);
      }}
    >
      {badge ? (
        <View className="absolute -top-3 right-6 rounded-full bg-[#7C6FCD] px-2 py-0.5">
          <Text
            className="font-nidoru-data-regular text-[11px] font-bold uppercase leading-4 tracking-wider text-[#EEF0FF]"
            selectable={false}
          >
            {badge}
          </Text>
        </View>
      ) : null}
      <View className="flex-row items-center gap-3">
        <View
          className={cn(
            "h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px]",
            isSelected ? "border-[#7C6FCD]" : "border-[#4A4E6A]",
          )}
        >
          {isSelected ? <View className="h-2.5 w-2.5 rounded-full bg-[#7C6FCD]" /> : null}
        </View>
        <View>
          <Text
            className="font-nidoru-primary-semibold text-base leading-[22px] text-[#EEF0FF]"
            selectable
          >
            {title}
          </Text>
          <Text
            className={cn(
              "mt-0.5 font-nidoru-primary-regular text-[13px] leading-[18px] text-[#8A8FA8]",
              isSelected ? "text-[#A89CE0]" : null,
            )}
            selectable
          >
            {subcopy}
          </Text>
        </View>
      </View>
      <View className="items-end">
        <Text
          className="font-nidoru-data-regular text-base font-bold leading-[22px] text-[#EEF0FF]"
          selectable
        >
          {price}
        </Text>
        <Text
          className="mt-0.5 font-nidoru-data-regular text-[13px] leading-[18px] text-[#8A8FA8]"
          selectable
        >
          {suffix}
        </Text>
      </View>
    </Pressable>
  );
}

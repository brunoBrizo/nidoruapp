import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

type ReduceMotionPreference = {
  readonly isResolved: boolean;
  readonly reduceMotionEnabled: boolean;
};

export function useReduceMotionPreference() {
  const [preference, setPreference] = useState<ReduceMotionPreference>({
    isResolved: false,
    reduceMotionEnabled: false,
  });

  useEffect(() => {
    let isMounted = true;

    void AccessibilityInfo.isReduceMotionEnabled()
      .then((isEnabled) => {
        if (isMounted) {
          setPreference({
            isResolved: true,
            reduceMotionEnabled: isEnabled,
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          setPreference({
            isResolved: true,
            reduceMotionEnabled: false,
          });
        }
      });

    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", (isEnabled) => {
      setPreference({
        isResolved: true,
        reduceMotionEnabled: isEnabled,
      });
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return preference;
}

export function useReduceMotionEnabled() {
  const preference = useReduceMotionPreference();

  return !preference.isResolved || preference.reduceMotionEnabled;
}

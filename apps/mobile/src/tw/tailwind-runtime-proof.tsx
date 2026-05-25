import { cn, Text, View } from ".";

export function TailwindRuntimeProof() {
  return (
    <View
      className={cn(
        "gap-2 rounded-nidoru-card border border-nidoru-dark-divider",
        "bg-nidoru-dark-surface-raised p-nidoru-sm",
      )}
      testID="tailwind-runtime-proof"
    >
      <Text className="font-nidoru-primary-bold text-nidoru-label text-nidoru-dark-accent">
        Tailwind runtime proof
      </Text>
      <Text className="font-nidoru-primary text-nidoru-body text-nidoru-dark-text-primary">
        This element is styled only with CSS-enabled className primitives.
      </Text>
    </View>
  );
}

import { ScrollView, Text } from "../tw";

type TabPlaceholderScreenProps = {
  readonly title: string;
  readonly description: string;
};

export function TabPlaceholderScreen({ title, description }: TabPlaceholderScreenProps) {
  return (
    <ScrollView
      className="flex-1 bg-nidoru-dark-background"
      contentContainerClassName="gap-nidoru-sm px-nidoru-screen pb-[104px] pt-nidoru-xl"
      contentInsetAdjustmentBehavior="automatic"
      testID="tab-placeholder-screen"
    >
      <Text
        accessibilityRole="header"
        className="font-nidoru-primary-bold text-nidoru-h1 text-nidoru-dark-text-primary"
        selectable
      >
        {title}
      </Text>
      <Text
        className="font-nidoru-primary-regular text-nidoru-body text-nidoru-dark-text-secondary"
        selectable
      >
        {description}
      </Text>
    </ScrollView>
  );
}

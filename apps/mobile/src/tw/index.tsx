import { Link as RouterLink } from "expo-router";
import React from "react";
import {
  Pressable as RNPressable,
  ScrollView as RNScrollView,
  Text as RNText,
  TextInput as RNTextInput,
  View as RNView,
  Animated as ReactNativeAnimated,
} from "react-native";
import { useCssElement, useNativeVariable } from "react-native-css";
import Reanimated from "react-native-reanimated";

export { cn } from "./cn";

type ClassNameProp = {
  className?: string;
};

type ContentContainerClassNameProp = {
  contentClassName?: string;
  contentContainerClassName?: string;
};

const classNameMapping = { className: "style" } as const;
const scrollViewClassNameMapping = {
  className: "style",
  contentClassName: "contentContainerStyle",
  contentContainerClassName: "contentContainerStyle",
} as const;
const ReanimatedViewComponent: React.ElementType = Reanimated.View;
const ReanimatedTextComponent: React.ElementType = Reanimated.Text;
const ReanimatedScrollViewComponent: React.ElementType = Reanimated.ScrollView;
const ReanimatedPressable = Reanimated.createAnimatedComponent(RNPressable);
const ReanimatedPressableComponent: React.ElementType = ReanimatedPressable;
const ReactNativeAnimatedViewComponent: React.ElementType = ReactNativeAnimated.View;
const ReactNativeAnimatedTextComponent: React.ElementType = ReactNativeAnimated.Text;

export const useCSSVariable =
  process.env.EXPO_OS !== "web" ? useNativeVariable : (variable: string) => `var(${variable})`;

export type ViewProps = React.ComponentPropsWithoutRef<typeof RNView> & ClassNameProp;

export const View = React.forwardRef<React.ElementRef<typeof RNView>, ViewProps>((props, ref) =>
  useCssElement(RNView, { ...props, ref }, classNameMapping),
);
View.displayName = "CSS(View)";

export type TextProps = React.ComponentPropsWithoutRef<typeof RNText> & ClassNameProp;

export const Text = React.forwardRef<React.ElementRef<typeof RNText>, TextProps>((props, ref) =>
  useCssElement(RNText, { ...props, ref }, classNameMapping),
);
Text.displayName = "CSS(Text)";

export type ScrollViewProps = React.ComponentPropsWithoutRef<typeof RNScrollView> &
  ClassNameProp &
  ContentContainerClassNameProp;

export const ScrollView = React.forwardRef<React.ElementRef<typeof RNScrollView>, ScrollViewProps>(
  (props, ref) => useCssElement(RNScrollView, { ...props, ref }, scrollViewClassNameMapping),
);
ScrollView.displayName = "CSS(ScrollView)";

export type PressableProps = React.ComponentPropsWithoutRef<typeof RNPressable> & ClassNameProp;

export const Pressable = React.forwardRef<React.ElementRef<typeof RNPressable>, PressableProps>(
  (props, ref) => useCssElement(RNPressable, { ...props, ref }, classNameMapping),
);
Pressable.displayName = "CSS(Pressable)";

export type TextInputProps = React.ComponentPropsWithoutRef<typeof RNTextInput> & ClassNameProp;

export const TextInput = React.forwardRef<React.ElementRef<typeof RNTextInput>, TextInputProps>(
  (props, ref) => useCssElement(RNTextInput, { ...props, ref }, classNameMapping),
);
TextInput.displayName = "CSS(TextInput)";

type RouterLinkProps = React.ComponentPropsWithoutRef<typeof RouterLink> & ClassNameProp;
type CSSLinkComponent = React.ForwardRefExoticComponent<
  RouterLinkProps & React.RefAttributes<React.ElementRef<typeof RouterLink>>
> &
  Pick<typeof RouterLink, "Trigger" | "Menu" | "MenuAction" | "Preview">;

export const Link = React.forwardRef<React.ElementRef<typeof RouterLink>, RouterLinkProps>(
  (props, ref) => useCssElement(RouterLink, { ...props, ref }, classNameMapping),
) as CSSLinkComponent;
Link.displayName = "CSS(Link)";
Link.Trigger = RouterLink.Trigger;
Link.Menu = RouterLink.Menu;
Link.MenuAction = RouterLink.MenuAction;
Link.Preview = RouterLink.Preview;

export type AnimatedViewProps = React.ComponentPropsWithoutRef<typeof Reanimated.View> &
  ClassNameProp;

export const AnimatedView = React.forwardRef<unknown, AnimatedViewProps>((props, ref) =>
  useCssElement(ReanimatedViewComponent, { ...props, ref }, classNameMapping),
);
AnimatedView.displayName = "CSS(Animated.View)";

export type AnimatedTextProps = React.ComponentPropsWithoutRef<typeof Reanimated.Text> &
  ClassNameProp;

export const AnimatedText = React.forwardRef<unknown, AnimatedTextProps>((props, ref) =>
  useCssElement(ReanimatedTextComponent, { ...props, ref }, classNameMapping),
);
AnimatedText.displayName = "CSS(Animated.Text)";

export type AnimatedScrollViewProps = React.ComponentPropsWithoutRef<typeof Reanimated.ScrollView> &
  ClassNameProp &
  ContentContainerClassNameProp;

export const AnimatedScrollView = React.forwardRef<unknown, AnimatedScrollViewProps>((props, ref) =>
  useCssElement(ReanimatedScrollViewComponent, { ...props, ref }, scrollViewClassNameMapping),
);
AnimatedScrollView.displayName = "CSS(Animated.ScrollView)";

export type AnimatedPressableProps = React.ComponentPropsWithoutRef<typeof ReanimatedPressable> &
  ClassNameProp;

export const AnimatedPressable = React.forwardRef<unknown, AnimatedPressableProps>((props, ref) =>
  useCssElement(ReanimatedPressableComponent, { ...props, ref }, classNameMapping),
);
AnimatedPressable.displayName = "CSS(Animated.Pressable)";

export const Animated = {
  ...Reanimated,
  Pressable: AnimatedPressable,
  ScrollView: AnimatedScrollView,
  Text: AnimatedText,
  View: AnimatedView,
};

export type ReactNativeAnimatedViewProps = React.ComponentPropsWithoutRef<
  typeof ReactNativeAnimated.View
> &
  ClassNameProp;

export const ReactNativeAnimatedView = React.forwardRef<unknown, ReactNativeAnimatedViewProps>(
  (props, ref) =>
    useCssElement(ReactNativeAnimatedViewComponent, { ...props, ref }, classNameMapping),
);
ReactNativeAnimatedView.displayName = "CSS(ReactNativeAnimated.View)";

export type ReactNativeAnimatedTextProps = React.ComponentPropsWithoutRef<
  typeof ReactNativeAnimated.Text
> &
  ClassNameProp;

export const ReactNativeAnimatedText = React.forwardRef<unknown, ReactNativeAnimatedTextProps>(
  (props, ref) =>
    useCssElement(ReactNativeAnimatedTextComponent, { ...props, ref }, classNameMapping),
);
ReactNativeAnimatedText.displayName = "CSS(ReactNativeAnimated.Text)";

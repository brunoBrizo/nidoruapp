import type { ReactElement, ReactNode } from "react";
import Svg, { Circle, G, Path, type SvgProps } from "react-native-svg";

export type SleepIconProps = SvgProps & {
  readonly color?: string;
  readonly size?: number;
  readonly strokeWidth?: number;
  readonly testID?: string;
};

export type SleepIconComponent = (props: SleepIconProps) => ReactElement;

type SolarIconFrameProps = Omit<SleepIconProps, "children" | "testID"> & {
  readonly children: ReactNode;
  readonly testID?: string;
};

function SolarIconFrame({
  children,
  color = "currentColor",
  size = 24,
  testID,
  ...props
}: SolarIconFrameProps) {
  const testProps = testID ? { testID } : {};

  return (
    <Svg
      accessible={false}
      color={color}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      {...props}
      {...testProps}
    >
      {children}
    </Svg>
  );
}

export function SolarPlayLinearIcon(props: SleepIconProps) {
  const color = props.color ?? "currentColor";
  const strokeWidth = props.strokeWidth ?? 1.5;

  return (
    <SolarIconFrame {...props}>
      <Path
        d="M20.409 9.353a2.998 2.998 0 0 1 0 5.294L7.597 21.614C5.534 22.737 3 21.277 3 18.968V5.033c0-2.31 2.534-3.769 4.597-2.648z"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
      />
    </SolarIconFrame>
  );
}

export function SolarClockCircleLinearIcon(props: SleepIconProps) {
  const color = props.color ?? "currentColor";
  const strokeWidth = props.strokeWidth ?? 1.5;

  return (
    <SolarIconFrame {...props}>
      <G fill="none" stroke={color} strokeWidth={strokeWidth}>
        <Circle cx="12" cy="12" r="10" />
        <Path d="M12 8v4l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
      </G>
    </SolarIconFrame>
  );
}

export function SolarAltArrowRightLinearIcon(props: SleepIconProps) {
  const color = props.color ?? "currentColor";
  const strokeWidth = props.strokeWidth ?? 1.5;

  return (
    <SolarIconFrame {...props}>
      <Path
        d="m9 5l6 7l-6 7"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </SolarIconFrame>
  );
}

export function SolarCloudRainLinearIcon(props: SleepIconProps) {
  const color = props.color ?? "currentColor";
  const strokeWidth = props.strokeWidth ?? 1.5;

  return (
    <SolarIconFrame {...props}>
      <Path
        d="M14.381 8.027a5.8 5.8 0 0 1 1.905-.321c.654 0 1.283.109 1.87.309m-11.04 2.594a4.4 4.4 0 0 0-.83-.08C3.919 10.53 2 12.426 2 14.765c0 1.31.602 2.48 1.547 3.258m3.57-7.414a5.6 5.6 0 0 1-.355-1.962C6.762 5.528 9.32 3 12.476 3c2.94 0 5.361 2.194 5.68 5.015m-11.04 2.594a4.3 4.3 0 0 1 1.55.634m9.49-3.228C20.392 8.78 22 10.881 22 13.353c0 1.94-.99 3.653-2.5 4.67M17 19l-2 2m1-5.5l-2 2M12 20l-2 2m1.5-6.5l-2 2m-2 1.5l-2 2"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
      />
    </SolarIconFrame>
  );
}

export function SolarSoundwaveLinearIcon(props: SleepIconProps) {
  const color = props.color ?? "currentColor";
  const strokeWidth = props.strokeWidth ?? 1.5;

  return (
    <SolarIconFrame {...props}>
      <Path
        d="M12 4v16m4-13v10M8 7v10m12-6v2M4 11v2"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={strokeWidth}
      />
    </SolarIconFrame>
  );
}

export function SolarFireLinearIcon(props: SleepIconProps) {
  const color = props.color ?? "currentColor";
  const strokeWidth = props.strokeWidth ?? 1.5;

  return (
    <SolarIconFrame {...props}>
      <G fill="none" stroke={color} strokeWidth={strokeWidth}>
        <Path d="M20 13.111C20 20.222 13.956 22 10.933 22C8.29 22 3 20.222 3 13.111c0-2.782 1.461-4.65 2.86-5.716c.778-.594 1.77-.003 1.87.971l.086.838c.105 1.02 1.033 1.857 1.893 1.298C11.394 9.407 12 6.775 12 5.333V5.01c0-1.43 1.444-2.35 2.602-1.512C17.165 5.35 20 8.584 20 13.11Z" />
        <Path d="M8 18.445C8 21.289 10.489 22 11.733 22c1.09 0 3.267-.711 3.267-3.555c0-1.102-.59-1.845-1.16-2.274c-.398-.299-.957-.03-1.094.449c-.178.624-.823 1.016-1.152.456c-.3-.512-.3-1.28-.3-1.743c0-.636-.64-1.048-1.155-.674C9.106 15.409 8 16.68 8 18.445Z" />
      </G>
    </SolarIconFrame>
  );
}

export function SolarWaterdropsLinearIcon(props: SleepIconProps) {
  const color = props.color ?? "currentColor";
  const strokeWidth = props.strokeWidth ?? 1.5;

  return (
    <SolarIconFrame {...props}>
      <Path
        d="M10 17.833C10 20.134 8.21 22 6 22s-4-1.866-4-4.167c0-1.44 1.566-3.361 2.738-4.598a1.724 1.724 0 0 1 2.524 0C8.434 14.472 10 16.393 10 17.833Zm12 0C22 20.134 20.21 22 18 22s-4-1.866-4-4.167c0-1.44 1.566-3.361 2.738-4.598a1.724 1.724 0 0 1 2.524 0C20.434 14.472 22 16.393 22 17.833Zm-6-10C16 10.134 14.21 12 12 12s-4-1.866-4-4.167c0-1.44 1.566-3.361 2.738-4.598a1.724 1.724 0 0 1 2.524 0C14.434 4.472 16 6.393 16 7.833Z"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
      />
    </SolarIconFrame>
  );
}

export function SolarWindLinearIcon(props: SleepIconProps) {
  const color = props.color ?? "currentColor";
  const strokeWidth = props.strokeWidth ?? 1.5;

  return (
    <SolarIconFrame {...props}>
      <G fill="none" stroke={color} strokeLinecap="round" strokeWidth={strokeWidth}>
        <Path d="M3 8h6.5A2.5 2.5 0 1 0 7 5.5v.357M4 14h14.5a3.5 3.5 0 1 1-3.5 3.5V17" />
        <Path d="M2 11h16.5A3.5 3.5 0 1 0 15 7.5V8" />
      </G>
    </SolarIconFrame>
  );
}

export function SolarBookBookmarkLinearIcon(props: SleepIconProps) {
  const color = props.color ?? "currentColor";
  const strokeWidth = props.strokeWidth ?? 1.5;

  return (
    <SolarIconFrame {...props}>
      <G fill="none" stroke={color} strokeWidth={strokeWidth}>
        <Path d="M4 8c0-2.828 0-4.243.879-5.121C5.757 2 7.172 2 10 2h4c2.828 0 4.243 0 5.121.879C20 3.757 20 5.172 20 8v8c0 2.828 0 4.243-.879 5.121C18.243 22 16.828 22 14 22h-4c-2.828 0-4.243 0-5.121-.879C4 20.243 4 18.828 4 16z" />
        <Path d="M19.898 16h-12c-.93 0-1.395 0-1.777.102A3 3 0 0 0 4 18.224" />
        <Path
          d="M8 7h8m-8 3.5h5m0 5.5v3.53c0 .276 0 .414-.095.47s-.224-.006-.484-.13l-1.242-.59c-.088-.04-.132-.062-.179-.062s-.091.021-.179.063l-1.242.59c-.26.123-.39.185-.484.129C9 19.944 9 19.806 9 19.53v-3.08"
          strokeLinecap="round"
        />
      </G>
    </SolarIconFrame>
  );
}

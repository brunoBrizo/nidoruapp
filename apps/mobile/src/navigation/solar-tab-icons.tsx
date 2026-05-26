import Svg, { Circle, G, Path, type SvgProps } from "react-native-svg";
import type { ReactNode } from "react";

type SolarTabIconProps = SvgProps & {
  readonly color?: string;
  readonly size?: number;
  readonly strokeWidth?: number;
  readonly testID?: string;
};

type SolarIconFrameProps = Omit<SolarTabIconProps, "children" | "testID"> & {
  readonly accessibilityLabel: string;
  readonly children: ReactNode;
  readonly testID?: string;
};

const defaultIconSize = 24;

function SolarIconFrame({
  accessibilityLabel,
  children,
  color = "currentColor",
  size = defaultIconSize,
  testID,
  ...props
}: SolarIconFrameProps) {
  const testProps = testID ? { testID } : {};

  return (
    <Svg
      accessibilityLabel={accessibilityLabel}
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

export function SolarHomeSmileBoldIcon(props: SolarTabIconProps) {
  const color = props.color ?? "currentColor";

  return (
    <SolarIconFrame {...props} accessibilityLabel="solar:home-smile-bold">
      <Path
        clipRule="evenodd"
        d="M2.52 7.823C2 8.77 2 9.915 2 12.203v1.522c0 3.9 0 5.851 1.172 7.063S6.229 22 10 22h4c3.771 0 5.657 0 6.828-1.212S22 17.626 22 13.725v-1.521c0-2.289 0-3.433-.52-4.381c-.518-.949-1.467-1.537-3.364-2.715l-2-1.241C14.111 2.622 13.108 2 12 2s-2.11.622-4.116 1.867l-2 1.241C3.987 6.286 3.038 6.874 2.519 7.823m6.927 7.575a.75.75 0 1 0-.894 1.204A5.77 5.77 0 0 0 12 17.75a5.77 5.77 0 0 0 3.447-1.148a.75.75 0 1 0-.894-1.204A4.27 4.27 0 0 1 12 16.25a4.27 4.27 0 0 1-2.553-.852"
        fill={color}
        fillRule="evenodd"
      />
    </SolarIconFrame>
  );
}

export function SolarMoonSleepLinearIcon(props: SolarTabIconProps) {
  const color = props.color ?? "currentColor";
  const strokeWidth = props.strokeWidth ?? 1.5;

  return (
    <SolarIconFrame {...props} accessibilityLabel="solar:moon-sleep-linear">
      <G fill="none">
        <Path
          d="M13.5 8h3l-3 3h3M18 2h4l-4 4h4"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
        />
        <Path
          d="m21.067 11.857l-.642-.388zm-8.924-8.924l-.388-.642zM21.25 12A9.25 9.25 0 0 1 12 21.25v1.5c5.937 0 10.75-4.813 10.75-10.75zM12 21.25A9.25 9.25 0 0 1 2.75 12h-1.5c0 5.937 4.813 10.75 10.75 10.75zM2.75 12A9.25 9.25 0 0 1 12 2.75v-1.5C6.063 1.25 1.25 6.063 1.25 12zm12.75 2.25A5.75 5.75 0 0 1 9.75 8.5h-1.5a7.25 7.25 0 0 0 7.25 7.25zm4.925-2.781A5.75 5.75 0 0 1 15.5 14.25v1.5a7.25 7.25 0 0 0 6.21-3.505zM9.75 8.5a5.75 5.75 0 0 1 2.781-4.925l-.776-1.284A7.25 7.25 0 0 0 8.25 8.5zM12 2.75a.38.38 0 0 1-.268-.118a.3.3 0 0 1-.082-.155c-.004-.031-.002-.121.105-.186l.776 1.284c.503-.304.665-.861.606-1.299c-.062-.455-.42-1.026-1.137-1.026zm9.71 9.495c-.066.107-.156.109-.187.105a.3.3 0 0 1-.155-.082a.38.38 0 0 1-.118-.268h1.5c0-.717-.571-1.075-1.026-1.137c-.438-.059-.995.103-1.299.606z"
          fill={color}
        />
      </G>
    </SolarIconFrame>
  );
}

export function SolarWindLinearIcon(props: SolarTabIconProps) {
  const color = props.color ?? "currentColor";
  const strokeWidth = props.strokeWidth ?? 1.5;

  return (
    <SolarIconFrame {...props} accessibilityLabel="solar:wind-linear">
      <G fill="none" stroke={color} strokeLinecap="round" strokeWidth={strokeWidth}>
        <Path d="M3 8h6.5A2.5 2.5 0 1 0 7 5.5v.357M4 14h14.5a3.5 3.5 0 1 1-3.5 3.5V17" />
        <Path d="M2 11h16.5A3.5 3.5 0 1 0 15 7.5V8" />
      </G>
    </SolarIconFrame>
  );
}

export function SolarChartLinearIcon(props: SolarTabIconProps) {
  const color = props.color ?? "currentColor";
  const strokeWidth = props.strokeWidth ?? 1.5;

  return (
    <SolarIconFrame {...props} accessibilityLabel="solar:chart-linear">
      <G fill="none" stroke={color} strokeWidth={strokeWidth}>
        <Path d="M22 22H2" strokeLinecap="round" />
        <Path d="M21 22v-7.5a1.5 1.5 0 0 0-1.5-1.5h-3a1.5 1.5 0 0 0-1.5 1.5V22m0 0V5c0-1.414 0-2.121-.44-2.56C14.122 2 13.415 2 12 2s-2.121 0-2.56.44C9 2.878 9 3.585 9 5v17m0 0V9.5A1.5 1.5 0 0 0 7.5 8h-3A1.5 1.5 0 0 0 3 9.5V22" />
      </G>
    </SolarIconFrame>
  );
}

export function SolarUserLinearIcon(props: SolarTabIconProps) {
  const color = props.color ?? "currentColor";
  const strokeWidth = props.strokeWidth ?? 1.5;

  return (
    <SolarIconFrame {...props} accessibilityLabel="solar:user-linear">
      <G fill="none" stroke={color} strokeWidth={strokeWidth}>
        <Circle cx="12" cy="6" r="4" />
        <Path d="M20 17.5c0 2.485 0 4.5-8 4.5s-8-2.015-8-4.5S7.582 13 12 13s8 2.015 8 4.5Z" />
      </G>
    </SolarIconFrame>
  );
}

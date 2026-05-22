import { colors } from "@nidoru/ui-tokens";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";

type FadeStop = {
  readonly offset: string;
  readonly color: string;
  readonly opacity: string;
};

type LinearFade = {
  readonly axis?: "horizontal" | "vertical";
  readonly height: number;
  readonly stops: readonly FadeStop[];
  readonly width: number;
  readonly x: number;
  readonly y: number;
};

type RadialFade = {
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly stops: readonly FadeStop[];
};

type CardFadeConfig = {
  readonly corner: RadialFade;
  readonly rightEdge: LinearFade;
  readonly topEdge: LinearFade;
  readonly viewBox: string;
  readonly wash?: LinearFade;
};

export type CardFadeVariant = "personalized-plan" | "profile" | "sleep-primary";

type CardFadeProps = {
  readonly testID: string;
  readonly variant: CardFadeVariant;
};

const primaryColor = colors.dark.primary.value;
const primaryGlowColor = colors.dark.primaryGlow.value;

const cardFadeVariants: Record<CardFadeVariant, CardFadeConfig> = {
  "personalized-plan": {
    viewBox: "0 0 309 224",
    wash: {
      axis: "vertical",
      x: 0,
      y: 0,
      width: 309,
      height: 224,
      stops: [
        { offset: "0", color: colors.dark.surfaceRaised.value, opacity: "1" },
        { offset: "0.52", color: colors.dark.surfaceRaised.value, opacity: "0.78" },
        { offset: "1", color: colors.dark.surface.value, opacity: "0.74" },
      ],
    },
    corner: {
      cx: 46,
      cy: 48,
      r: 146,
      stops: [
        { offset: "0", color: primaryGlowColor, opacity: "0.22" },
        { offset: "0.3", color: primaryColor, opacity: "0.14" },
        { offset: "0.7", color: primaryColor, opacity: "0.055" },
        { offset: "1", color: primaryColor, opacity: "0" },
      ],
    },
    topEdge: {
      x: 34,
      y: 0.3,
      width: 275,
      height: 1.4,
      stops: [
        { offset: "0", color: primaryGlowColor, opacity: "0" },
        { offset: "0.44", color: primaryGlowColor, opacity: "0.08" },
        { offset: "1", color: primaryGlowColor, opacity: "0.14" },
      ],
    },
    rightEdge: {
      x: 307.8,
      y: 22,
      width: 1.2,
      height: 170,
      stops: [
        { offset: "0", color: primaryGlowColor, opacity: "0.1" },
        { offset: "0.58", color: primaryGlowColor, opacity: "0.045" },
        { offset: "1", color: primaryGlowColor, opacity: "0" },
      ],
    },
  },
  profile: {
    viewBox: "0 0 362 134",
    wash: {
      x: 94,
      y: 0,
      width: 268,
      height: 134,
      stops: [
        { offset: "0", color: primaryColor, opacity: "0" },
        { offset: "0.48", color: primaryColor, opacity: "0.035" },
        { offset: "1", color: primaryGlowColor, opacity: "0.11" },
      ],
    },
    corner: {
      cx: 362,
      cy: 0,
      r: 132,
      stops: [
        { offset: "0", color: primaryGlowColor, opacity: "0.16" },
        { offset: "0.44", color: primaryColor, opacity: "0.095" },
        { offset: "1", color: primaryColor, opacity: "0" },
      ],
    },
    topEdge: {
      x: 102,
      y: 0.3,
      width: 260,
      height: 1.4,
      stops: [
        { offset: "0", color: primaryGlowColor, opacity: "0" },
        { offset: "0.58", color: primaryGlowColor, opacity: "0.08" },
        { offset: "1", color: primaryGlowColor, opacity: "0.18" },
      ],
    },
    rightEdge: {
      x: 360.3,
      y: 0,
      width: 1.4,
      height: 92,
      stops: [
        { offset: "0", color: primaryGlowColor, opacity: "0.18" },
        { offset: "0.62", color: primaryGlowColor, opacity: "0.06" },
        { offset: "1", color: primaryGlowColor, opacity: "0" },
      ],
    },
  },
  "sleep-primary": {
    viewBox: "0 0 362 128",
    corner: {
      cx: 376,
      cy: -8,
      r: 206,
      stops: [
        { offset: "0", color: primaryGlowColor, opacity: "0.145" },
        { offset: "0.34", color: primaryGlowColor, opacity: "0.078" },
        { offset: "0.72", color: primaryColor, opacity: "0.022" },
        { offset: "1", color: primaryColor, opacity: "0" },
      ],
    },
    topEdge: {
      x: 168,
      y: 0.3,
      width: 194,
      height: 1.2,
      stops: [
        { offset: "0", color: primaryGlowColor, opacity: "0" },
        { offset: "0.52", color: primaryGlowColor, opacity: "0.04" },
        { offset: "1", color: primaryGlowColor, opacity: "0.1" },
      ],
    },
    rightEdge: {
      x: 360.4,
      y: 0,
      width: 1.2,
      height: 80,
      stops: [
        { offset: "0", color: primaryGlowColor, opacity: "0.1" },
        { offset: "0.68", color: primaryGlowColor, opacity: "0.035" },
        { offset: "1", color: primaryGlowColor, opacity: "0" },
      ],
    },
  },
};

export function CardFade({ testID, variant }: CardFadeProps) {
  const config = cardFadeVariants[variant];
  const washId = `${variant}-card-wash`;
  const cornerId = `${variant}-card-corner`;
  const topEdgeId = `${variant}-card-top-edge`;
  const rightEdgeId = `${variant}-card-right-edge`;

  return (
    <View pointerEvents="none" style={styles.layer} testID={testID}>
      <Svg height="100%" preserveAspectRatio="none" viewBox={config.viewBox} width="100%">
        <Defs>
          {config.wash ? (
            <LinearGradient
              id={washId}
              x1="0"
              x2={config.wash.axis === "vertical" ? "0" : "1"}
              y1="0"
              y2={config.wash.axis === "vertical" ? "1" : "0"}
            >
              {renderStops(washId, config.wash.stops)}
            </LinearGradient>
          ) : null}
          <LinearGradient id={topEdgeId} x1="0" x2="1" y1="0" y2="0">
            {renderStops(topEdgeId, config.topEdge.stops)}
          </LinearGradient>
          <LinearGradient id={rightEdgeId} x1="0" x2="0" y1="0" y2="1">
            {renderStops(rightEdgeId, config.rightEdge.stops)}
          </LinearGradient>
          <RadialGradient
            cx={config.corner.cx}
            cy={config.corner.cy}
            fx={config.corner.cx}
            fy={config.corner.cy}
            gradientUnits="userSpaceOnUse"
            id={cornerId}
            r={config.corner.r}
          >
            {renderStops(cornerId, config.corner.stops)}
          </RadialGradient>
        </Defs>
        {config.wash ? (
          <Rect
            fill={`url(#${washId})`}
            height={config.wash.height}
            width={config.wash.width}
            x={config.wash.x}
            y={config.wash.y}
          />
        ) : null}
        <Circle
          cx={config.corner.cx}
          cy={config.corner.cy}
          fill={`url(#${cornerId})`}
          r={config.corner.r}
        />
        <Rect
          fill={`url(#${topEdgeId})`}
          height={config.topEdge.height}
          width={config.topEdge.width}
          x={config.topEdge.x}
          y={config.topEdge.y}
        />
        <Rect
          fill={`url(#${rightEdgeId})`}
          height={config.rightEdge.height}
          width={config.rightEdge.width}
          x={config.rightEdge.x}
          y={config.rightEdge.y}
        />
      </Svg>
    </View>
  );
}

function renderStops(id: string, stops: readonly FadeStop[]) {
  return stops.map((stop) => (
    <Stop
      key={`${id}-${stop.offset}`}
      offset={stop.offset}
      stopColor={stop.color}
      stopOpacity={stop.opacity}
    />
  ));
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
});

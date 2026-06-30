import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Text as SvgText } from 'react-native-svg';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { format, isToday, isYesterday } from 'date-fns';
import { colors, fonts, fontSizes } from '../theme';
import { XanoRecentCheckInEmotion, XanoLast7CheckIn } from '../api';

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatCheckInDate(timestamp: number): string {
  const date = new Date(timestamp);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
}


// Fixed chart line colours — consistent regardless of emotion
const ENERGY_COLOUR = '#B8907A';       // terracotta
const PLEASANTNESS_COLOUR = '#91A27D'; // primary green

// Check-in coordinates live on an 8×8 grid: each axis takes the discrete
// values -4,-3,-2,-1,1,2,3,4 (no 0). We lock the chart's Y domain to [-4, 4]
// so the left-hand axis labels are always the clean integers -4,-2,0,2,4 and
// a given height means the same energy / pleasantness level on every render
// (chart-kit otherwise auto-scales to each batch's min/max). chart-kit has no
// yMin/yMax prop, so we anchor the domain with an invisible dataset carrying
// the two extremes — getDatas() flattens every dataset when computing both the
// labels and the point positions, so this fixes the scale without drawing
// anything (transparent stroke, no dots).
const Y_DOMAIN_MIN = -4;
const Y_DOMAIN_MAX = 4;
const Y_AXIS_ANCHOR = {
  data: [Y_DOMAIN_MAX, Y_DOMAIN_MIN],
  color: () => 'transparent',
  strokeWidth: 0,
  withDots: false,
};

interface LastCheckInCardProps {
  recentEmotion?: XanoRecentCheckInEmotion | null;
  last7CheckIns?: XanoLast7CheckIn[] | null;
  onTrendsPress?: () => void;
  /** When provided, replaces the chart area with custom content (e.g. onboarding progress) */
  children?: React.ReactNode;
}

interface TooltipState {
  x: number;
  y: number;
  emotionText: string;
  date: string;
}

export default function LastCheckInCard({ recentEmotion, last7CheckIns = [], onTrendsPress, children }: LastCheckInCardProps) {
  const [chartWidth, setChartWidth] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const emotionName = capitalize(recentEmotion?.Display ?? 'Reflective');
  // themeColour is the readable, darker brand tone — use it as the base.
  // emotionColour is typically lighter / more saturated, so it reads as a
  // shine highlight rather than the body of the word.
  const emotionColour = recentEmotion?.emotionColour ?? colors.primary;
  const themeColour = recentEmotion?.themeColour ?? colors.primary;

  const onChartLayout = useCallback((e: LayoutChangeEvent) => {
    setChartWidth(e.nativeEvent.layout.width);
  }, []);

  // Sanitize check-ins: drop any entry with non-finite numeric fields. Bad
  // values flow through chart-kit into <Circle cx={NaN} /> and crash RNSVG's
  // RawPropsParser on the new architecture.
  const sortedCheckIns = useMemo(
    () =>
      [...(last7CheckIns || [])]
        .filter(
          (c) =>
            c &&
            Number.isFinite(c.loggedDateTime) &&
            Number.isFinite(c.xAxis) &&
            Number.isFinite(c.yAxis),
        )
        .sort((a, b) => a.loggedDateTime - b.loggedDateTime),
    [last7CheckIns],
  );

  const chartData = useMemo(() => {
    if (sortedCheckIns.length === 0) {
      return {
        labels: ['–', '–', '–', '–', '–', '–', '–'],
        datasets: [
          { data: [0, 0, 0, 0, 0, 0, 0], color: () => ENERGY_COLOUR, strokeWidth: 2.5 },
          { data: [0, 0, 0, 0, 0, 0, 0], color: () => PLEASANTNESS_COLOUR, strokeWidth: 2.5 },
          Y_AXIS_ANCHOR,
        ],
      };
    }
    return {
      labels: sortedCheckIns.map((c) => formatCheckInDate(c.loggedDateTime)),
      datasets: [
        { data: sortedCheckIns.map((c) => Number(c.yAxis)), color: () => ENERGY_COLOUR, strokeWidth: 2.5 },
        { data: sortedCheckIns.map((c) => Number(c.xAxis)), color: () => PLEASANTNESS_COLOUR, strokeWidth: 2.5 },
        Y_AXIS_ANCHOR,
      ],
    };
  }, [sortedCheckIns]);

  const useBezier = sortedCheckIns.length !== 1;

  const handleDataPointClick = (data: { index: number; value: number; x: number; y: number; dataset: unknown; getColor: (opacity: number) => string }) => {
    if (sortedCheckIns.length === 0) return;
    const checkIn = sortedCheckIns[data.index];
    if (!checkIn) return;
    setTooltip({
      x: data.x,
      y: data.y,
      emotionText: capitalize(checkIn.emotionText),
      date: format(new Date(checkIn.loggedDateTime), 'EEE, d MMM'),
    });
    setTimeout(() => setTooltip(null), 2500);
  };

  // Width of chart-kit's left gutter (its mis-named `paddingRight` constant)
  // where the Y-axis labels sit. We override the 64px default down to 28 via
  // `styles.chart.paddingRight` so the labels sit nearly flush with the card's
  // left edge (aligned with the title/legend) instead of floating inset. This
  // value MUST match that style override, and the date decorator below
  // positions against the same origin so the dates stay aligned with the dots.
  const Y_AXIS_GUTTER = 28;

  return (
    <View style={styles.outer}>
      {/* ── "I'm feeling, [Gradient Emotion]" ── */}
      <View style={styles.feelingRow}>
        <Text style={styles.feelingLabel}>I'm feeling,</Text>
        <Text style={[styles.feelingLabel, styles.emotionText, { color: themeColour }]}>{emotionName}</Text>
      </View>

      {/* ── Body: onboarding progress or 7-day chart ── */}
      {children ? children : <View style={styles.pulseArea}>
        <View style={styles.chartTitleRow}>
          <Text style={styles.chartTitle}>Last 7 Check Ins</Text>
          {onTrendsPress && (
            <TouchableOpacity onPress={onTrendsPress} activeOpacity={0.6}>
              <Text style={styles.trendsLink}>My Trends {'>'}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDash, { backgroundColor: ENERGY_COLOUR }]} />
          <Text style={styles.legendText}>Energy</Text>
          <View style={[styles.legendDash, { backgroundColor: PLEASANTNESS_COLOUR }]} />
          <Text style={styles.legendText}>Pleasantness</Text>
        </View>

        <View style={styles.chartWrap} onLayout={onChartLayout}>
          {chartWidth > 0 && chartData.datasets[0].data.length > 0 ? (
            <>
              <LineChart
                data={chartData}
                width={chartWidth}
                height={120}
                withDots={true}
                withInnerLines={false}
                withOuterLines={false}
                withVerticalLines={false}
                withHorizontalLines={true}
                withVerticalLabels={false}
                withHorizontalLabels={true}
                segments={4}
                yAxisLabel=""
                yAxisSuffix=""
                yAxisInterval={1}
                fromZero={false}
                formatYLabel={(v) => String(Math.round(Number(v)))}
                onDataPointClick={handleDataPointClick}
                chartConfig={{
                  backgroundColor: 'transparent',
                  backgroundGradientFrom: 'transparent',
                  backgroundGradientFromOpacity: 0,
                  backgroundGradientTo: 'transparent',
                  backgroundGradientToOpacity: 0,
                  fillShadowGradient: 'transparent',
                  fillShadowGradientFrom: 'transparent',
                  fillShadowGradientFromOpacity: 0,
                  fillShadowGradientTo: 'transparent',
                  fillShadowGradientToOpacity: 0,
                  fillShadowGradientOpacity: 0,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                  labelColor: () => colors.textMuted,
                  style: { borderRadius: 0 },
                  propsForBackgroundLines: {
                    stroke: 'rgba(0,0,0,0.06)',
                    strokeDasharray: '',
                  },
                  propsForLabels: {
                    fontSize: 10,
                    fontFamily: fonts.body,
                  },
                  propsForDots: {
                    r: '3',
                    strokeWidth: '0',
                  },
                }}
                decorator={() => {
                  if (sortedCheckIns.length === 0) return null;
                  const pRight = Y_AXIS_GUTTER;
                  const svgW = chartWidth;
                  return (
                    <>
                      {sortedCheckIns.map((c, i) => {
                        const x = pRight + (i * (svgW - pRight)) / sortedCheckIns.length;
                        return (
                          <SvgText
                            key={i}
                            x={x}
                            y={118}
                            fontSize={10}
                            fill={colors.textPlaceholder}
                            textAnchor="middle"
                          >
                            {formatCheckInDate(c.loggedDateTime)}
                          </SvgText>
                        );
                      })}
                    </>
                  );
                }}
                bezier={useBezier}
                style={styles.chart}
              />
              {tooltip && (
                <View
                  style={[
                    styles.tooltip,
                    {
                      left: Math.min(Math.max(tooltip.x - 55, 0), chartWidth - 120),
                      top: Math.max(tooltip.y - 56, 0),
                    },
                  ]}
                >
                  <Text style={styles.tooltipEmotion}>{tooltip.emotionText}</Text>
                  <Text style={styles.tooltipDate}>{tooltip.date}</Text>
                </View>
              )}
            </>
          ) : null}
        </View>

      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginBottom: 16,
  },

  // ── Feeling statement ──
  feelingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  feelingLabel: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.bodyBold,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  emotionMask: {
    flexShrink: 1,
    flexDirection: 'row',
  },
  emotionText: {
    // Keeps the gradient emotion on the same baseline as "I'm feeling,"
    // on both iOS and Android (SVG text baselines drift on Android).
    includeFontPadding: false,
  },
  emotionSizer: {
    // Transparent text used purely to size the LinearGradient container
    // to the mask — its visible fill comes from the mask, not from here.
    opacity: 0,
  },

  // ── Pulse ──
  pulseArea: {},
  chartTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bodySemiBold,
    color: colors.textSecondary,
  },
  trendsLink: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bodyBold,
    color: colors.primary,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingLeft: 2,
  },
  legendDash: {
    width: 14,
    height: 2.5,
    borderRadius: 1.5,
  },
  legendText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
    marginRight: 10,
  },
  chartWrap: {
    position: 'relative',
    overflow: 'visible',
  },
  chart: {
    borderRadius: 0,
    // Overrides chart-kit's 64px default left gutter — keep in sync with
    // Y_AXIS_GUTTER so the Y labels and date decorator share the same origin.
    paddingRight: 28,
  },
  // ── Tooltip ──
  tooltip: {
    position: 'absolute',
    backgroundColor: colors.textPrimary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 110,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  tooltipEmotion: {
    fontFamily: fonts.heading,
    fontSize: fontSizes.sm,
    color: '#FFFFFF',
  },
  tooltipDate: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 1,
    letterSpacing: 0.2,
  },
});

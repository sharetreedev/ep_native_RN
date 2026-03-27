import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, Animated, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Svg, { Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
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

function lightenColor(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgb(${Math.min(255, Math.round(r + (255 - r) * amount))}, ${Math.min(255, Math.round(g + (255 - g) * amount))}, ${Math.min(255, Math.round(b + (255 - b) * amount))})`;
}

// Fixed chart line colours — consistent regardless of emotion
const ENERGY_COLOUR = '#B8907A';       // terracotta
const PLEASANTNESS_COLOUR = '#91A27D'; // primary green

interface LastCheckInCardProps {
  recentEmotion?: XanoRecentCheckInEmotion | null;
  last7CheckIns?: XanoLast7CheckIn[] | null;
  onTrendsPress?: () => void;
}

interface TooltipState {
  x: number;
  y: number;
  emotionText: string;
  date: string;
}

export default function LastCheckInCard({ recentEmotion, last7CheckIns = [], onTrendsPress }: LastCheckInCardProps) {
  const [chartWidth, setChartWidth] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const emotionName = capitalize(recentEmotion?.Display ?? 'Reflective');
  const emotionColour = recentEmotion?.emotionColour ?? colors.primary;
  const themeColour = recentEmotion?.themeColour ?? colors.primary;

  // Shine — gentle brightness pulse on the gradient
  const shineAnim = useRef(new Animated.Value(0)).current;
  const [shineLift, setShineLift] = useState(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(3000),
        Animated.timing(shineAnim, { toValue: 1, duration: 600, useNativeDriver: false }),
        Animated.timing(shineAnim, { toValue: 0, duration: 600, useNativeDriver: false }),
      ])
    );
    loop.start();
    const id = shineAnim.addListener(({ value }) => setShineLift(value));
    return () => { loop.stop(); shineAnim.removeListener(id); };
  }, [shineAnim]);

  const gradStart = shineLift > 0 ? lightenColor(themeColour, shineLift * 0.35) : themeColour;
  const gradEnd = shineLift > 0 ? lightenColor(emotionColour, shineLift * 0.35) : emotionColour;

  const onChartLayout = useCallback((e: LayoutChangeEvent) => {
    setChartWidth(e.nativeEvent.layout.width);
  }, []);

  const sortedCheckIns = [...(last7CheckIns || [])].sort(
    (a, b) => a.loggedDateTime - b.loggedDateTime,
  );

  // Use short day labels (e.g. "Mon", "Tue") for x-axis
  let chartData = {
    labels: [] as string[],
    datasets: [
      { data: [] as number[], color: () => ENERGY_COLOUR, strokeWidth: 2.5 },
      { data: [] as number[], color: () => PLEASANTNESS_COLOUR, strokeWidth: 2.5 },
    ],
  };

  if (sortedCheckIns.length > 0) {
    chartData.labels = sortedCheckIns.map((c) => formatCheckInDate(c.loggedDateTime));
    chartData.datasets[0].data = sortedCheckIns.map((c) => c.yAxis);
    chartData.datasets[1].data = sortedCheckIns.map((c) => c.xAxis);
  } else {
    chartData.labels = ['–', '–', '–', '–', '–', '–', '–'];
    chartData.datasets[0].data = [0, 0, 0, 0, 0, 0, 0];
    chartData.datasets[1].data = [0, 0, 0, 0, 0, 0, 0];
  }

  const useBezier = sortedCheckIns.length !== 1;

  const handleDataPointClick = (data: { index: number; value: number; x: number; y: number; datasetIndex: number }) => {
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

  // Extra width so lines bleed off both edges
  const chartOverflow = 48;

  return (
    <View style={styles.outer}>
      {/* ── "I'm feeling, [Gradient Emotion]" ── */}
      <View style={styles.feelingRow}>
        <Text style={styles.feelingLabel}>I'm feeling,</Text>
        <Svg height={32} width={emotionName.length * 16} style={styles.emotionSvg}>
          <Defs>
            <SvgLinearGradient id="emotionGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={gradStart} />
              <Stop offset="1" stopColor={gradEnd} />
            </SvgLinearGradient>
          </Defs>
          <SvgText
            fill="url(#emotionGrad)"
            fontSize={24}
            fontWeight="900"
            fontFamily={fonts.bodyBold}
            y={24}
            x={0}
          >
            {emotionName}
          </SvgText>
        </Svg>
      </View>

      {/* ── Pulse: your 7-day rhythm ── */}
      <View style={styles.pulseArea}>
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
                width={chartWidth + chartOverflow}
                height={120}
                withDots={true}
                withInnerLines={false}
                withOuterLines={false}
                withVerticalLines={false}
                withHorizontalLines={false}
                withVerticalLabels={false}
                withHorizontalLabels={false}
                yAxisLabel=""
                yAxisSuffix=""
                yAxisInterval={1}
                formatYLabel={() => ''}
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
                  const pRight = 64;
                  const svgW = chartWidth + chartOverflow;
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

      </View>
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
  emotionSvg: {
    flexShrink: 1,
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
    marginHorizontal: -16,
    overflow: 'visible',
  },
  chart: {
    borderRadius: 0,
    marginHorizontal: -24,
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

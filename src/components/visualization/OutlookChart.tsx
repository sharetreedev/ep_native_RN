import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { colors } from '../../theme';

interface OutlookChartProps {
  data: number[];
  height?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 48; // Horizontal padding

const OutlookChart: React.FC<OutlookChartProps> = ({ data, height = 180 }) => {
  if (!data || data.length === 0) return null;

  const maxVal = 100;
  const stepX = CHART_WIDTH / (data.length - 1);
  
  const points = data.map((val, i) => ({
    x: i * stepX,
    y: height - (val / maxVal) * height,
  }));

  const pathData = points.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    return `${acc} L ${point.x} ${point.y}`;
  }, '');

  const areaData = `${pathData} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <View style={[styles.container, { height }]}>
      <Svg width={CHART_WIDTH} height={height}>
        <Defs>
          <LinearGradient id="outlookGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.chartOutlookFrom} stopOpacity="0.4" />
            <Stop offset="1" stopColor={colors.chartOutlookFrom} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        
        {/* Area */}
        <Path d={areaData} fill="url(#outlookGradient)" />
        
        {/* Line */}
        <Path
          d={pathData}
          fill="none"
          stroke={colors.chartOutlookFrom}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Highlight points */}
        {points.map((point, i) => (
          <Circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={colors.background}
            stroke={colors.chartOutlookFrom}
            strokeWidth="2"
          />
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default OutlookChart;

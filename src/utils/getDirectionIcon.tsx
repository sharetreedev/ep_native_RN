import React from 'react';
import {
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  ArrowUpLeft,
  ArrowDownRight,
  ArrowDownLeft,
  CircleMinus,
} from 'lucide-react-native';
import { colors } from '../theme';

export function getDirectionIcon(directionLabel: string | null | undefined, size = 20) {
  const iconColor = colors.textPrimary;
  switch (directionLabel?.toLowerCase()) {
    case 'up': return <ArrowUp size={size} color={iconColor} />;
    case 'down': return <ArrowDown size={size} color={iconColor} />;
    case 'right': return <ArrowRight size={size} color={iconColor} />;
    case 'left': return <ArrowLeft size={size} color={iconColor} />;
    case 'top right': return <ArrowUpRight size={size} color={iconColor} />;
    case 'top left': return <ArrowUpLeft size={size} color={iconColor} />;
    case 'bottom right': return <ArrowDownRight size={size} color={iconColor} />;
    case 'bottom left': return <ArrowDownLeft size={size} color={iconColor} />;
    default: return <CircleMinus size={size} color={colors.textPlaceholder} />;
  }
}

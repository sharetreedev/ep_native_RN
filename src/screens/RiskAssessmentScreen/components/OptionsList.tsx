import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Option } from '../constants';
import { styles } from '../styles';

interface OptionsListProps {
  options: Option[];
  selected: number | null;
  onSelect: (value: number) => void;
}

export default function OptionsList({ options, selected, onSelect }: OptionsListProps) {
  return (
    <View style={styles.optionsList}>
      {options.map((opt) => {
        const isSelected = selected === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.optionRow, isSelected && styles.optionRowSelected]}
            activeOpacity={0.7}
            onPress={() => onSelect(opt.value)}
          >
            <View style={[styles.radio, isSelected && styles.radioSelected]}>
              {isSelected && <View style={styles.radioInner} />}
            </View>
            <View style={styles.optionTextWrap}>
              <Text style={styles.optionLabel}>
                {opt.label}
                <Text style={styles.optionDesc}>  -  {opt.description}</Text>
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

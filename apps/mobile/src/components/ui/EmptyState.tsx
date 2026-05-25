import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../theme';

type Props = {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon = 'sparkles-outline', title, description, actionLabel, onAction }: Props) {
  const { colors: c, isDark } = useTheme();
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.wrap}>
      <View style={[styles.iconWrap, { backgroundColor: isDark ? c.surface : '#f1f5f9' }]}>
        <Ionicons name={icon} size={42} color={c.textMuted} />
      </View>
      <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      {description && <Text style={[styles.desc, { color: c.textMuted }]}>{description}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          style={[styles.btn, { backgroundColor: c.primary }]}
          activeOpacity={0.85}
        >
          <Text style={styles.btnTxt}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingVertical: 60 },
  iconWrap: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  desc: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  btn: { paddingHorizontal: 22, paddingVertical: 12, borderRadius: 24, marginTop: 8 },
  btnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

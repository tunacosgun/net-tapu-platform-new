import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../../theme';

type Props = {
  label?: string;
  value: string;
  onChangeText: (rawDigits: string) => void;
  placeholder?: string;
  suffix?: string;
  error?: string;
} & Omit<TextInputProps, 'value' | 'onChangeText'>;

function formatTr(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('tr-TR');
}

function stripFormat(formatted: string): string {
  return formatted.replace(/[^\d]/g, '');
}

/** Numeric input with Turkish thousands-separator (500.000). Stores raw digits via onChangeText. */
export function FormattedPriceInput({ label, value, onChangeText, placeholder, suffix = '₺', error, ...rest }: Props) {
  const { colors: c, isDark } = useTheme();
  const [display, setDisplay] = useState(formatTr(value));

  useEffect(() => { setDisplay(formatTr(value)); }, [value]);

  function handleChange(text: string) {
    const raw = stripFormat(text);
    setDisplay(formatTr(raw));
    onChangeText(raw);
  }

  return (
    <View>
      {label && <Text style={[styles.label, { color: c.text }]}>{label}</Text>}
      <View style={[styles.wrap, { backgroundColor: isDark ? c.surface : '#fff', borderColor: error ? '#ef4444' : c.border }]}>
        <TextInput
          {...rest}
          value={display}
          onChangeText={handleChange}
          keyboardType="numeric"
          placeholder={placeholder}
          placeholderTextColor={c.textMuted}
          style={[styles.input, { color: c.text }]}
        />
        {suffix && <Text style={[styles.suffix, { color: c.textMuted }]}>{suffix}</Text>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  wrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, height: 48 },
  input: { flex: 1, fontSize: 15 },
  suffix: { fontSize: 14, fontWeight: '600' },
  error: { color: '#ef4444', fontSize: 12, marginTop: 4 },
});

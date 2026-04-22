import { Platform, TextStyle } from 'react-native';

/**
 * NetTapu Mobile Typography
 * iOS: SF Pro (System)
 * Android: Roboto (System default in RN)
 * Professional hierarchy, tabular nums for prices via fontVariant.
 */
const fontFamily = Platform.OS === 'ios' ? 'System' : 'sans-serif';
const fontFamilyBold = Platform.OS === 'ios' ? 'System' : 'sans-serif-medium';

const base = { fontFamily };

export const Typography = {
  display:      { ...base, fontFamily: fontFamilyBold, fontSize: 34, fontWeight: '800', lineHeight: 40, letterSpacing: -0.8 } as TextStyle,
  h1:           { ...base, fontFamily: fontFamilyBold, fontSize: 28, fontWeight: '800', lineHeight: 34, letterSpacing: -0.6 } as TextStyle,
  h2:           { ...base, fontFamily: fontFamilyBold, fontSize: 22, fontWeight: '700', lineHeight: 28, letterSpacing: -0.4 } as TextStyle,
  h3:           { ...base, fontFamily: fontFamilyBold, fontSize: 18, fontWeight: '700', lineHeight: 24, letterSpacing: -0.2 } as TextStyle,
  h4:           { ...base, fontFamily: fontFamilyBold, fontSize: 16, fontWeight: '700', lineHeight: 22, letterSpacing: -0.1 } as TextStyle,
  body:         { ...base, fontSize: 15, fontWeight: '400', lineHeight: 22 } as TextStyle,
  bodyMedium:   { ...base, fontSize: 15, fontWeight: '500', lineHeight: 22 } as TextStyle,
  bodyBold:     { ...base, fontFamily: fontFamilyBold, fontSize: 15, fontWeight: '700', lineHeight: 22 } as TextStyle,
  bodySmall:    { ...base, fontSize: 13, fontWeight: '400', lineHeight: 18 } as TextStyle,
  bodySmallMed: { ...base, fontSize: 13, fontWeight: '500', lineHeight: 18 } as TextStyle,
  caption:      { ...base, fontSize: 12, fontWeight: '400', lineHeight: 16 } as TextStyle,
  captionMed:   { ...base, fontSize: 12, fontWeight: '500', lineHeight: 16 } as TextStyle,
  captionBold:  { ...base, fontFamily: fontFamilyBold, fontSize: 12, fontWeight: '700', lineHeight: 16 } as TextStyle,
  label:        { ...base, fontSize: 14, fontWeight: '500', lineHeight: 20 } as TextStyle,
  labelBold:    { ...base, fontFamily: fontFamilyBold, fontSize: 14, fontWeight: '700', lineHeight: 20 } as TextStyle,
  overline:     { ...base, fontFamily: fontFamilyBold, fontSize: 10, fontWeight: '800', lineHeight: 14, letterSpacing: 1.2, textTransform: 'uppercase' } as TextStyle,
  button:       { ...base, fontFamily: fontFamilyBold, fontSize: 15, fontWeight: '700', lineHeight: 20, letterSpacing: 0.2 } as TextStyle,
  buttonSmall:  { ...base, fontFamily: fontFamilyBold, fontSize: 13, fontWeight: '700', lineHeight: 16, letterSpacing: 0.2 } as TextStyle,
  tabLabel:     { ...base, fontFamily: fontFamilyBold, fontSize: 10, fontWeight: '700', lineHeight: 14, letterSpacing: 0.4 } as TextStyle,
  price:        { ...base, fontFamily: fontFamilyBold, fontSize: 22, fontWeight: '800', lineHeight: 28, letterSpacing: -0.5, fontVariant: ['tabular-nums'] } as TextStyle,
  priceLarge:   { ...base, fontFamily: fontFamilyBold, fontSize: 32, fontWeight: '800', lineHeight: 38, letterSpacing: -0.8, fontVariant: ['tabular-nums'] } as TextStyle,
  priceSmall:   { ...base, fontFamily: fontFamilyBold, fontSize: 17, fontWeight: '800', lineHeight: 22, letterSpacing: -0.3, fontVariant: ['tabular-nums'] } as TextStyle,
};

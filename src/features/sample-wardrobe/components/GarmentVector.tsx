import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Defs, G, Line, Path, Pattern, Rect } from 'react-native-svg';

import type { Fit, Pattern as PatternId } from '@/domain/categories';
import { colorHex, getColor, shadeHex } from '@/domain/palette';

import { resolveShape } from '../garment-shapes';

export interface GarmentVectorProps {
  shapeId: string;
  colorId: string;
  fit?: Fit | null;
  pattern?: PatternId | null;
  size: number;
  accessibilityLabel?: string;
}

/**
 * Renders a sample garment from its vector shape. Color/fit/pattern changes re-render instantly
 * and locally (no network, no image files) — the preview really changes (prompt §3.2).
 */
export function GarmentVector({ shapeId, colorId, fit, pattern, size, accessibilityLabel }: GarmentVectorProps) {
  const uid = useId().replace(/:/g, '');
  const fill = colorHex(colorId);
  const light = (getColor(colorId)?.luminanceGroup ?? 1) === 2;
  const stroke = light ? '#9C9A94' : shadeHex(fill, 0.35);
  const detail = light ? '#8C8A84' : shadeHex(fill, 0.45);
  const shape = resolveShape(shapeId, fit);
  const patternFill = pattern && pattern !== 'solid' ? `url(#p${uid})` : null;
  const patternInk = light ? 'rgba(31,49,80,0.55)' : 'rgba(255,255,255,0.45)';

  const svg = (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {patternFill ? (
        <Defs>
          <Pattern id={`p${uid}`} patternUnits="userSpaceOnUse" width={pattern === 'check' ? 10 : 6} height={pattern === 'check' ? 10 : 6}>
            {pattern === 'stripe' ? <Rect x={0} y={0} width={6} height={2.2} fill={patternInk} /> : null}
            {pattern === 'check' ? (
              <G>
                <Rect x={0} y={0} width={10} height={1.6} fill={patternInk} />
                <Rect x={0} y={0} width={1.6} height={10} fill={patternInk} />
              </G>
            ) : null}
            {pattern === 'denimWash' ? <Line x1={0} y1={6} x2={6} y2={0} stroke="rgba(255,255,255,0.18)" strokeWidth={1.2} /> : null}
            {pattern === 'graphic' ? <Rect x={2} y={2} width={2} height={2} fill={patternInk} /> : null}
          </Pattern>
        </Defs>
      ) : null}
      {shape.fills.map((d, i) => (
        <G key={`f${i}`}>
          <Path d={d} fill={fill} stroke={stroke} strokeWidth={1.2} strokeLinejoin="round" />
          {patternFill ? <Path d={d} fill={patternFill} /> : null}
        </G>
      ))}
      {shape.details.map((d, i) => (
        <Path key={`d${i}`} d={d} fill="none" stroke={detail} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </Svg>
  );
  // Accessibility lives on a wrapping View: react-native-svg forwards `accessible` to the DOM on web.
  return accessibilityLabel ? (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      {svg}
    </View>
  ) : (
    svg
  );
}

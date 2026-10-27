import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type TabIconName = 'home' | 'community' | 'recommend' | 'wardrobe' | 'profile';

/**
 * Thin-line tab glyphs drawn to match the showcase tab bar (house · two people · sparkle ·
 * wardrobe · person). Focused = filled. Self-drawn so no icon font licensing is involved.
 */
export function TabIcon({ name, color, focused, size = 24, cutout }: { name: TabIconName; color: string; focused: boolean; size?: number; cutout: string }) {
  const fill = focused ? color : 'none';
  const sw = 1.6;
  const common = { stroke: color, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'home' ? (
        <>
          <Path d="M4 10.4 12 4l8 6.4V19.5a1 1 0 0 1-1 1h-4.6v-5.8H9.6v5.8H5a1 1 0 0 1-1-1z" fill={fill} {...common} />
          {focused ? <Path d="M9.6 20.5v-5.8h4.8v5.8" stroke={cutout} strokeWidth={sw} fill="none" /> : null}
        </>
      ) : null}
      {name === 'community' ? (
        <>
          <Circle cx={9} cy={8.2} r={3.2} fill={fill} {...common} />
          <Path d="M3.4 19.5c.5-3.4 2.8-5.4 5.6-5.4s5.1 2 5.6 5.4z" fill={fill} {...common} />
          <Circle cx={16.4} cy={8.8} r={2.6} fill={fill} {...common} />
          <Path d="M15.6 13.9c2.7-.3 4.6 1.5 5 4.6" fill="none" {...common} />
        </>
      ) : null}
      {name === 'recommend' ? (
        <>
          <Path d="M10.5 4.5c.6 4 2.6 6 6.5 6.6-3.9.6-5.9 2.6-6.5 6.6-.6-4-2.6-6-6.5-6.6 3.9-.6 5.9-2.6 6.5-6.6z" fill={fill} {...common} />
          <Path d="M18 3c.25 1.4.9 2.05 2.3 2.3-1.4.25-2.05.9-2.3 2.3-.25-1.4-.9-2.05-2.3-2.3 1.4-.25 2.05-.9 2.3-2.3z" fill={fill} {...common} />
          <Path d="M17.6 15.6c.2 1.1.7 1.6 1.8 1.8-1.1.2-1.6.7-1.8 1.8-.2-1.1-.7-1.6-1.8-1.8 1.1-.2 1.6-.7 1.8-1.8z" fill={fill} {...common} />
        </>
      ) : null}
      {name === 'wardrobe' ? (
        <>
          <Rect x={5} y={3.5} width={14} height={17} rx={2} fill={fill} {...common} />
          <Path d="M12 3.5v17M10.1 10.5v2.4M13.9 10.5v2.4" stroke={focused ? cutout : color} strokeWidth={sw} strokeLinecap="round" />
        </>
      ) : null}
      {name === 'profile' ? (
        <>
          <Circle cx={12} cy={8} r={3.8} fill={fill} {...common} />
          <Path d="M4.6 20.4c.9-3.9 3.8-6.1 7.4-6.1s6.5 2.2 7.4 6.1z" fill={fill} {...common} />
        </>
      ) : null}
    </Svg>
  );
}

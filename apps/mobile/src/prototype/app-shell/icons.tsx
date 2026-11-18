// PROTOTYPE (#51 app shell) — throwaway line icons, drawn by hand because @gravity-ui/icons
// isn't wired up on the phone yet. 24px grid, 1.8 stroke, round caps (design system: Iconography).

import Svg, { Circle, Path } from 'react-native-svg';

const paths = {
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  home: ['M4 11l8-7 8 7', 'M6 10v10h12V10'],
  rounds: ['M9 6h11', 'M9 12h11', 'M9 18h11', 'M4.5 6h.01', 'M4.5 12h.01', 'M4.5 18h.01'],
  trends: ['M4 19h16', 'M4 15l5-5 4 3 7-7'],
  plus: ['M12 5v14', 'M5 12h14'],
  pin: ['M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z'],
  shield: ['M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z'],
  signOut: ['M14 4h5v16h-5', 'M10 8l-4 4 4 4', 'M6 12h10'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
} as const;

export type IconName = keyof typeof paths | 'practice';

export function Icon({ name, color, size = 22 }: { name: IconName; color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {name === 'practice' ? (
        <>
          <Circle cx={12} cy={12} r={8} />
          <Circle cx={12} cy={12} r={4} />
          <Circle cx={12} cy={12} r={0.6} fill={color} />
        </>
      ) : (
        paths[name].map((d) => <Path key={d} d={d} />)
      )}
    </Svg>
  );
}

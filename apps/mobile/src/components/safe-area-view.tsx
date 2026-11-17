import { SafeAreaView as BaseSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

/** Uniwind only adds `className` to React Native's own components, so this one is wrapped. */
export const SafeAreaView = withUniwind(BaseSafeAreaView);

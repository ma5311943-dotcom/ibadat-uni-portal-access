import { StatusBar } from "expo-status-bar";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";

import { StudentLookupScreen } from "./src/screens/StudentLookupScreen";

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <StatusBar style="light" />
      <StudentLookupScreen />
    </SafeAreaProvider>
  );
}

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return <>
    <StatusBar style="light" />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0B1020" } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="module/[slug]" options={{ presentation: "card" }} />
    </Stack>
  </>;
}
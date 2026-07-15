import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { C, font } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.brand,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: {
          backgroundColor: C.card,
          borderTopColor: C.line,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 66,
          paddingBottom: Platform.OS === 'ios' ? 28 : 9,
          paddingTop: 9,
        },
        tabBarLabelStyle: { fontFamily: font.bodySemi, fontSize: 10.5 },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="browse"
        options={{ title: 'Browse', tabBarIcon: ({ color, size }) => <Ionicons name="leaf" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="market"
        options={{ title: 'Market', tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="delivery"
        options={{ title: 'Delivery', tabBarIcon: ({ color, size }) => <Ionicons name="navigate" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: 'More', tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} /> }}
      />
    </Tabs>
  );
}

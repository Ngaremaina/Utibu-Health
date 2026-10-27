import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { DrawerContent } from '@/components/DrawerContent';
import { LoadingView } from '@/components/Feedback';
import { useAuth } from '@/context/AuthContext';
import { CartScreen } from '@/screens/CartScreen';
import { CheckoutScreen } from '@/screens/CheckoutScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { OrdersScreen } from '@/screens/OrdersScreen';
import { ProductsScreen } from '@/screens/ProductsScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { RegisterScreen } from '@/screens/RegisterScreen';
import { colors } from '@/theme';

import type { AppStackParamList, AuthStackParamList, DrawerParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

function MainDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{ drawerActiveTintColor: colors.primary }}
    >
      <Drawer.Screen name="Products" component={ProductsScreen} />
      <Drawer.Screen name="Cart" component={CartScreen} />
      <Drawer.Screen name="Orders" component={OrdersScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} options={{ title: 'My account' }} />
    </Drawer.Navigator>
  );
}

export function RootNavigator() {
  const { status } = useAuth();

  if (status === 'loading') return <LoadingView />;

  return (
    <NavigationContainer>
      {status === 'signedIn' ? (
        <AppStack.Navigator>
          <AppStack.Screen name="Main" component={MainDrawer} options={{ headerShown: false }} />
          <AppStack.Screen name="Checkout" component={CheckoutScreen} />
        </AppStack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Register" component={RegisterScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}

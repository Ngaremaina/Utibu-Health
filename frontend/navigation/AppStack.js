import React from "react";
import DashboardScreen from "../screens/DashboardScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { createDrawerNavigator } from '@react-navigation/drawer';
import DrawerContent from "../src/DrawerContent";
import CartScreen from "../screens/CartScreen";
import OrderScreen from "../screens/OrderScreen";
import PaymentScreen from "../screens/PaymentScreen";

export default function AppStack(){
    const Drawer = createDrawerNavigator();
     
    
    return(
        <Drawer.Navigator drawerContent={(props) => <DrawerContent {...props} />}>
            <Drawer.Screen name="Dashboard" component={DashboardScreen} />
            <Drawer.Screen name="Profile" component={ProfileScreen} />
            <Drawer.Screen name = "Cart" component={CartScreen}/>
            <Drawer.Screen name = "Orders" component={OrderScreen}/>
            <Drawer.Screen name = "Payment" component={PaymentScreen  }  />
           
        </Drawer.Navigator>
    )
    
}
import LoginScreen from "../screens/LoginScreen"
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Register from "../screens/RegisterScreen";

const Stack = createNativeStackNavigator();

export default function AuthStack(){
    
    return(
        <Stack.Navigator screenOptions={{headerShown: false}}>
            <Stack.Screen name = "Login" component = {LoginScreen}/>
            <Stack.Screen name="Register" component={Register}/>
            

        </Stack.Navigator>

    )
}
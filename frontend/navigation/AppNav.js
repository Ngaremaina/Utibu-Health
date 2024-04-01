import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";
import AppStack from "./AppStack";
import { NavigationContainer } from '@react-navigation/native';
import {ActivityIndicator, View, StyleSheet} from "react-native"
import AuthStack from "./AuthStack";

export default function AppNav(){
    const { isLoading, userToken } = useContext(AuthContext);

    if (isLoading){
        return(
            <View >
                <ActivityIndicator size={'large'} />
            </View>

        )
        

    }

    return(
        <NavigationContainer>
            {userToken !== null ? <AppStack/> : <AuthStack/>}
                   
        </NavigationContainer>
    )
}


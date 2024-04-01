import React, { useContext } from "react";
import { View, Text } from "react-native";
import { AuthContext } from "../context/AuthContext";

export default function ProfileScreen (){
    const {userData} = useContext(AuthContext)
    return(
        <View>
            <Text>Email Address: {userData.user_data.email}</Text>
            <Text>User name: {userData.user_data.username}</Text>
            
        </View>
    )
}
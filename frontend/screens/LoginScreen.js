import React, {useContext, useState} from "react";
import { AuthContext } from "../context/AuthContext";
import {View, Text, TextInput, Button, TouchableOpacity, StyleSheet} from "react-native"


export default function LoginScreen({navigation}){

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const {loginUser} = useContext(AuthContext)

    const handleSubmit = () => {
        loginUser(email, password)
    }
    
        
        
    return(
        <View style = {styles.container}>
            <Text style ={{fontSize:25, textAlign:"center", fontWeight:700}}>Login</Text>
            <Text>Email</Text>
            <TextInput 
            placeholder="email"
            value={email}
            onChangeText={data => setEmail(data)}/>

            <Text>Password</Text>
            <TextInput 
            placeholder="Password"
            value={password}
            onChangeText={data => setPassword(data)} 
            secureTextEntry={true}/>

            <Button title="Submit" onPress={handleSubmit}/>

            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={{textAlign:"center",fontSize: 25,color: '#AD40AF', fontWeight: '700'}}> Register</Text>
            </TouchableOpacity>

        </View>

        )

    

}

const styles = StyleSheet.create({

    container:{
        flex:1,
        justifyContent:"center",
        alignContent:"center",
        padding:10
    }
})
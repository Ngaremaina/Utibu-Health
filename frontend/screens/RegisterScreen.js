import { View, Text, TextInput, Button, TouchableOpacity ,StyleSheet} from "react-native"
import { useState } from "react"
import axios from "axios"
import { BASE_URL } from "../config"

export default function Register({navigation}){
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [username, setUserName] = useState("")
    

    const handleSubmit = () => {
        axios.post(`${BASE_URL}/register`, {
            username,
            email,
            password
        })
        .then(res=> {
            if (res.status === 200){
                navigation.navigate('Login');
            }
        })
        .catch(error => console.log(error))
    }
    
        
        
    return(
        <View style = {styles.container}>
            <Text style = {{fontSize:25, textAlign:"center", fontWeight:700}}>Register</Text>
            <Text>Username</Text>
            <TextInput 
            placeholder="username"
            value={username}
            onChangeText={data => setUserName(data)}/>

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

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={{textAlign:"center",fontSize: 25,color: '#AD40AF', fontWeight: '700'}}> Login</Text>
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
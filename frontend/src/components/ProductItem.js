import { View, Image, Text, Button,StyleSheet, SafeAreaView } from "react-native"
import axios from "axios"
import { BASE_URL } from "../../config"


export default function ProductItem({name, image_url, price, description,user_id, expiration_date, usage_instructions, warnings}){
    const quantity = 1
    const total = quantity * price


    const handleCart = () => {
        // console.log(user_id)
        axios.post(`${BASE_URL}/cart`,{
            name,
            price,
            description,
            image_url,
            quantity,
            total,
            user_id

        })
        .then(res => res.data)
        .catch(error => console.log(error))
        
    }
    return(

        <View style ={{maxWidth:"100%", margin:"auto", textAlign:"center", padding:15}}>
            <Image
                style={{width: '100%', height: 250, objectFit:"contain"}}
                source={{uri:image_url}}
            />
            <View >
                <Text >{name}</Text>
                <Text>Kshs. {price}</Text>
                <Text>{description}</Text>
                <Text>Best Before: {expiration_date}</Text>
                <Text>Instructions: {usage_instructions}</Text>
                <Text>Note: {warnings}</Text>
                <SafeAreaView>
                    <View>
                        <Text>
                        <Button 
                        title="Add to Cart" 
                        onPress={handleCart} 
                        style = {{maxWidth:"70%"}}/></Text>
                    </View>
                </SafeAreaView>              

            </View>
        </View>

    )
}


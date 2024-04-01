import { View, Text, Image} from "react-native"
import { ScrollView } from "react-native-gesture-handler"

export default function OrderItem({orders}){
    const displayOrder = orders?.map(order => {
        return <View key = {order.id} style ={{maxWidth:"100%", margin:"auto", textAlign:"center", padding:15}}>
        <Image
            style={{width: '100%', height: 250, objectFit:"contain"}}
            source={{uri:order.image_url}}
        />
        <View >
            <Text >{order.name}</Text>
            <Text>Kshs. {order.price}</Text>
            <Text>{order.description}</Text>
            <Text>Paid Via: {order.payment_description}</Text>
        </View>
    </View>
    })
    return (
        <ScrollView>
            {displayOrder}
        </ScrollView>
    )
}
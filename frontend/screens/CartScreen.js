import { useContext, useEffect, useState,useMemo } from "react";
import { View, Text,Image, Button, StyleSheet } from "react-native";
import { AuthContext } from "../context/AuthContext";
import axios from "axios"
import { BASE_URL } from "../config";
import { ScrollView } from "react-native-gesture-handler";

export default function CartScreen({navigation}){
    const {userData} = useContext(AuthContext)
    const [cart, setCart] = useState([])

    

    useEffect(() => {
        fetchCart()
    },[])

    const fetchCart = () => {
        axios.get(`${BASE_URL}/users/${userData.id}`)
        .then(response => {
            setCart(response.data)
        })
        .catch(error => {
            console.error('Error:', error);
        });

    }

    const updateCart = (id, name, description, price, quantity, image_url, total, user_id) => {
        axios.patch(`${BASE_URL}/cart/${id}`,{
            name,
            description,
            price,
            quantity,
            image_url,
            total,
            user_id

        })
        .then(response => {
            response.data
            fetchCart()
        })
        .catch(error => console.log(error))
    }

    const calculateGrandTotal = () => {
        let grandTotal = 0
        cart.cart?.map(item => {
            grandTotal += item.total

        })

        return grandTotal
    }

    let memorizedResult = useMemo(() => calculateGrandTotal())

    

    const handleDelete = (id) => {
        axios.delete(`${BASE_URL}/cart/${id}`)
        fetchCart()
    
    }

    const displayCart = cart.cart?.map(item => {
        return <View key = {item.name} style = {{maxWidth:"100%", margin:"auto", textAlign:"center", padding:15}}>
             <Image style={{width: '100%', height: 250, objectFit:"contain"}}
                 source={{uri: item.image_url}}/>
             <Text>{item.name}</Text>
             <Text>{item.description}</Text>
             <Text>Quantity: {item.quantity}</Text>
             <Text>Kshs. {item.total}</Text>
             <View style = {{display:"flex", flexDirection:"row", justifyContent:"center", }}>
                <Text style ={{padding: 10}}>
                <Button title="-" onPress={() => {
                 if (item.quantity <= 1){
                    item.quantity = 1
                    item.total = item.quantity * item.price
                    updateCart(item.id, item.name, item.description, item.price, item.quantity, item.image_url, item.total, userData.id)
                }
                else{
                    item.quantity = item.quantity - 1
                    item.total = item.quantity * item.price 
                    updateCart(item.id, item.name, item.description, item.price, item.quantity, item.image_url, item.total, userData.id)
                }
             }}/> </Text>
             <Text style ={{padding: 10}}>

             
             <Button title="+" onPress={() => {
                 item.quantity = item.quantity + 1
                 item.total = item.quantity * item.price
                updateCart(item.id, item.name, item.description, item.price, item.quantity, item.image_url, item.total, userData.id)
             }}/></Text>

             <Text style ={{padding: 10}}>
             <Button title="X" onPress={() => handleDelete(item.id)}/></Text>
            

             </View>
             

        </View>
    })

    const handleCheckout =() => {
        navigation.navigate("Payment") 
        
    }

    return(
        <ScrollView style = {styles.container}>
            {displayCart}
            
            <View style ={{padding: 20}}>
            <Text>Grand Total: Kshs. {memorizedResult }</Text>
            <Text style = {styles.container}>           
            <Button title="Checkout" onPress={handleCheckout}></Button> </Text>

            </View>
            
        </ScrollView>
    )

}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      
      backgroundColor: '#fff',
    },
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
    },
    itemsContainer: {
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 5,
      padding: 10,
    },
    item: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
  });
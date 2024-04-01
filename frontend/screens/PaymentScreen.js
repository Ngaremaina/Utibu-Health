import React from 'react';
import { View,Text, TouchableOpacity, StyleSheet, Button, TextInput } from 'react-native';
import { useState, useContext, useEffect } from 'react';
import { useMemo } from 'react';
import axios from 'axios';
import { BASE_URL } from '../config';
import { AuthContext } from '../context/AuthContext';
import { CheckBox } from 'react-native-elements';
import { ScrollView } from 'react-native-gesture-handler';

export default function PaymentScreen ({navigation, route}) {
    const [payment, setPayment] = useState('')
    const [phone, setPhone] = useState('')
    const [cart, setCart] = useState([])
    const {userData} = useContext(AuthContext)
    const [checked, setChecked] = useState(false);
    const [location, setLocation] = useState(0)

    const [region, setRegion] = useState("")
    const [address, setAddress] = useState("")
    const [city, setCity] = useState("")
    const user_id = userData.id

    const paymentOptions = [
      { id: 1, name: 'Cash on delivery', icon: '💰' },
      { id: 2, name: 'MPESA', icon: '💰' }
    ];

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

    const calculateGrandTotal = () => {
        let grandTotal = 0
        cart.cart?.map(item => {
            grandTotal += item.total
        })

        return grandTotal
    }
    var objectCart = {}
    cart.cart?.map(item => {
        // console.log(item)
        objectCart = Object.assign(item)
    })

    delete objectCart.id

    objectCart.payment_description = payment
    objectCart.shipping_id = location
    // console.log(objectCart)

    let total = useMemo(() => calculateGrandTotal())

    const addOrder = () => {
        axios.post(`${BASE_URL}/orders`,
            objectCart)
        .then(res => {
          res.data
          navigation.navigate('Orders');
        })
        .catch(error => console.log(error))
    }

    
    const addPayment = () => {
        let number = "254" + phone
        const phone_number = parseInt(number)
        axios.post(`${BASE_URL}/payments`,{
          phone_number,
          total
        })
        .then(res => {
            if (res.status === 200){
                addOrder()
                
            }
            res.data})
        .catch(error => console.log(error))
        

    }

    const handleSubmit = () => {        
        axios.post(`${BASE_URL}/shipping`, {
            region,
            address, 
            city,
            user_id
        })
        .then(res=> {
            setLocation(res.data.id)
        })
        .catch(error => console.log(error))

    }

    // console.log(location)
  
   
    const handlePaymentSelect = (option) => {
      setPayment(option.name)
    };

    
    return (
   

      <ScrollView>
         <View style = {styles.container}>
            <Text>Address</Text>
            <TextInput 
            placeholder="Address"
            value={address}
            onChangeText={data => setAddress(data)}/>

            <Text>City</Text>
            <TextInput 
            placeholder="City"
            value={city}
            onChangeText={data => setCity(data)} />

            <Text>Region</Text>
            <TextInput 
            placeholder="Region"
            value={region}
            onChangeText={data => setRegion(data)} />


            <Button title="Submit" onPress={handleSubmit}/>

        </View>
         <View style={styles.container}>
      <Text style={styles.title}>Select Payment Option</Text>
      {paymentOptions.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={styles.option}
          onPress={() => handlePaymentSelect(option)}
        >
          <Text style={styles.icon}>{option.icon}</Text>
          <Text style={styles.name}>{option.name}</Text>
        </TouchableOpacity>
      ))}

        <CheckBox
                title='Delivery fees: Kshs. 250'
                checked={checked}
                onPress={() => setChecked(!checked)}
                />
            {checked ? <Text>Grand Total: Kshs. {total += 250}</Text> : <Text>Grand Total: Kshs. {total}</Text>}

      {payment === "MPESA" ? (
        <View>
          <Text>Phone</Text>
          <TextInput 
          placeholder="712345678"
          value={phone}
          onChangeText={data => setPhone(data)} />
          
          <Button title = "Pay" onPress={addPayment}></Button>
        </View>
    

     ) : 
     <View>
      
       <Button title='Confirm' onPress={addOrder}/>


     </View>
    
     
     
     }
    </View>

      </ScrollView>
       
   
      // </View>
      
  );



};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  icon: {
    fontSize: 24,
    marginRight: 10,
  },
  name: {
    fontSize: 18,
  },
});
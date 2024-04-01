import { useContext, useState, useEffect } from "react"
import { AuthContext } from "../context/AuthContext"
import axios from "axios"
import { BASE_URL } from "../config"
import { ScrollView } from "react-native-gesture-handler"
import OrderItem from "../src/components/OrderItem"

export default function OrderScreen(){
    const {userData} = useContext(AuthContext)
    const [data, setData] = useState([])
    

    useEffect(() => {
        const timerId = setTimeout(fetchData, 5000); // Delay of 3000 milliseconds (3 seconds)

        // Clean up function to clear the timer when the component unmounts or re-renders
        return () => {
        clearTimeout(timerId);
        };
       
    },[])

    const fetchData = () => {
        axios.get(`${BASE_URL}/users/${userData.id}`)
        .then(response => {
            setData(response.data)
        })
        .catch(error => {
            console.error('Error:', error);
        });

    }    

    const displayOrders = data.shipping?.map(item => {
        return <OrderItem orders = {item.orders} key ={1} />
    })

  
    return(
        <ScrollView>            
            {displayOrders}
        </ScrollView>
    )
}
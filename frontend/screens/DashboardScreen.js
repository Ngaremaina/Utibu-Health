import React, { useEffect, useState } from "react";
import { View } from "react-native";
import axios from "axios"
import { BASE_URL } from "../config";
import ProductList from "../src/components/ProductList";
export default function DashboardScreen(){
    const [products, setProducts] = useState([])

    useEffect(() => {
        fetchData()

    },[])

    const fetchData = () => {
        axios.get(`${BASE_URL}/products`)
        .then(response => {
            setProducts(response.data)
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
    return(
        <View>
            <ProductList products={products}/>

        </View>
    )
}
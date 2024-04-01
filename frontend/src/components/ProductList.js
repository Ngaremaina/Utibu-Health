import { ScrollView } from "react-native"
import ProductItem from "./ProductItem"
import { useContext } from "react"
import { AuthContext } from "../../context/AuthContext"

export default function ProductList({products}){
    const {userData} = useContext(AuthContext)
    // console.log(`This is in Product LIST ${userData.id}`)

    const displayProducts = products?.map((product) => {
        return <ProductItem 
        key={product.name} 
        name = {product.name} 
        image_url = {product.image_url} 
        price = {product.price} 
        description={product.description}
        usage_instructions={product.usage_instructions}
        warnings={product.warnings}
        expiration_date={product.expiration_date}

        user_id = {userData.id}/>
    })
    return (
       
             <ScrollView>
                {displayProducts}
            </ScrollView>

    )
}
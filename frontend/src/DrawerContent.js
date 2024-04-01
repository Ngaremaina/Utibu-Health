import React, { createContext, useContext } from 'react';
import { View, Text, ImageBackground, Image, TouchableOpacity, StyleSheet} from 'react-native';
import { DrawerContentScrollView, DrawerItemList} from '@react-navigation/drawer';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AuthContext } from '../context/AuthContext';

export default function DrawerContent (props) {
    const {logoutUser, userData} = useContext(AuthContext)
  return (
    <View style={{flex: 1}}>
      <DrawerContentScrollView {...props} contentContainerStyle={{backgroundColor: '#ccc'}}>
        <ImageBackground 
        source={{uri: 'https://cdn.pixabay.com/photo/2016/11/30/18/14/like-1873541_1280.png'}}
        style={{padding: 20}}>
          <Image 
          source={{uri: 'https://cdn.pixabay.com/photo/2016/11/30/18/14/like-1873541_1280.png'}}
          style={styles.image}/>
          <Text style={[styles.text, {fontSize:25}]}> {userData.user_data.username} </Text>
          
        </ImageBackground>

        <View style={styles.menu}>
          <DrawerItemList {...props} />
        </View>

      </DrawerContentScrollView>
      <View style={styles.bottom}>
        <TouchableOpacity onPress={() => logoutUser()} style={{paddingVertical: 15}}>
          <View style={styles.container}>
            <Ionicons name="exit-outline" size={22} />
            <Text
              style={styles.text}>
              Sign Out
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
    text:{
        fontSize: 15,
        marginLeft: 5,
    },
    container:{
        flexDirection: 'row', 
        alignItems: 'center'

    },
    bottom:{
        paddingLeft: 20, 
        borderTopWidth: 1, 
        borderTopColor: "silver"
    },
    menu:{
        flex: 1, 
        backgroundColor: '#fff', 
        paddingTop: 10
    },
    image:{
        height: 80, 
        width: 80, 
        borderRadius: 40,
        marginBottom: 10
    }
})
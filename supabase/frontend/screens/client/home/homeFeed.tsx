import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/StacNavigation';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

// ─── Iconos SVG ─────────────────────────────────────────

const SearchIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
    <Circle cx="11" cy="11" r="8" />
    <Path d="m21 21-4.35-4.35" />
  </Svg>
);

const MicIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
    <Path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <Path d="M12 19v3" />
  </Svg>
);

const StarIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="#FFB800" stroke="#FFB800" strokeWidth="2">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </Svg>
);

const MessageIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);

const HomeIcon = ({ active }: { active?: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#22c55e" : "none"} stroke={active ? "#22c55e" : "#9CA3AF"} strokeWidth="2">
    <Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Path d="M9 22V12h6v10" />
  </Svg>
);

const OrdersIcon = ({ active }: { active?: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#22c55e" : "#9CA3AF"} strokeWidth="2">
    <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <Path d="M3 6h18" />
    <Path d="M16 10a4 4 0 0 1-8 0" />
  </Svg>
);

const ProfileIcon = ({ active }: { active?: boolean }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#22c55e" : "#9CA3AF"} strokeWidth="2">
    <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

// ─── Tipos ─────────────────────────────────────────

interface Restaurant {
  id: string;
  nombre: string;
  descripcion: string;
  calificacion: number;
  banner_url: string;
  deliveryTime?: string;
  badge?: string;
  sucursal_id: string;
}

// ─── Backend Fetch ─────────────────────────────────────────

const handleGetBusinness = async (ciudad: string, categoria: string) => {
  try {
    const params = new URLSearchParams({
      ciudad: ciudad,
      categoria: categoria
    });

    const response = await fetch(
      `https://kivo-v1.onrender.com/api/v1/negocios/sucursales?${params}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
      }
    );

    if (!response.ok) {
      console.log("Error:", response.status);
      return [];
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("Error de red:", error);
    return [];
  }
};

const categories = ['All', 'Tacos', 'Coffee', 'Healthy', 'Fast Food', 'Asian'];

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────

export default function HomeFeed() {

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [businness, setBusinness] = useState<Restaurant[]>([]);
  const [cityProvisional] = useState('La Piedad');

  useEffect(() => {
    const fetchData = async () => {
      const data = await handleGetBusinness(cityProvisional, selectedCategory);
      setBusinness(data);
    };
    fetchData();
  }, [selectedCategory, cityProvisional]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >

        {/* HEADER */}

        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>Kivo</Text>
            <Text style={styles.tagline}>AI-Powered Food Ordering</Text>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' }}
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>

          {/* SEARCH */}

          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <SearchIcon />
              <TextInput
                style={styles.searchInput}
                placeholder="Ask Pidelo: 'Best tacos near me?'"
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity style={styles.micButton}>
                <MicIcon />
              </TouchableOpacity>
            </View>
          </View>

          {/* CATEGORIAS */}

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category && styles.categoryTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* RESTAURANTES */}

          <View style={styles.cardsContainer}>

            {businness.map((restaurant) => (

              <View key={restaurant.id} style={styles.card}>

                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("BusinessDetail", {
                      sucursal_id: restaurant.sucursal_id
                    })
                  }
                >

                  <View style={styles.cardImageContainer}>
                    <Image
                      source={{ uri: restaurant.banner_url }}
                      style={styles.cardImage}
                    />

                    <View style={styles.ratingBadge}>
                      <StarIcon />
                      <Text style={styles.ratingText}>{restaurant.calificacion}</Text>
                    </View>

                  </View>

                  <View style={styles.cardContent}>

                    <Text style={styles.restaurantName}>{restaurant.nombre}</Text>

                    <Text style={styles.restaurantDescription}>
                      {restaurant.descripcion}
                    </Text>

                    <TouchableOpacity style={styles.orderButton}>
                      <MessageIcon />
                      <Text style={styles.orderButtonText}>Chat & Order</Text>
                    </TouchableOpacity>

                  </View>

                </TouchableOpacity>

              </View>

            ))}

          </View>

          <View style={{ height: 100 }} />

        </ScrollView>

        {/* BOTTOM NAV */}

        <View style={styles.bottomNav}>

          <TouchableOpacity style={styles.navItem}>
            <HomeIcon active />
            <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Orders')}>
            <OrdersIcon />
            <Text style={styles.navText}>Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
            <ProfileIcon />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>

        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── STYLES ─────────────────────────────────────────

const styles = StyleSheet.create({

container:{flex:1,backgroundColor:'#fff'},

header:{
flexDirection:'row',
justifyContent:'space-between',
alignItems:'center',
padding:16
},

logoText:{fontSize:24,fontWeight:'bold'},
tagline:{fontSize:12,color:'#22c55e'},

avatar:{width:40,height:40,borderRadius:20},

searchContainer:{padding:16},

searchBar:{
flexDirection:'row',
alignItems:'center',
backgroundColor:'#F3F4F6',
borderRadius:12,
padding:12
},

searchInput:{flex:1,marginLeft:8},

micButton:{padding:4},

categoryChip:{
paddingHorizontal:16,
paddingVertical:8,
backgroundColor:'#F3F4F6',
borderRadius:20,
marginLeft:16
},

categoryChipActive:{backgroundColor:'#22c55e'},

categoryText:{color:'#6B7280'},
categoryTextActive:{color:'#fff'},

cardsContainer:{padding:16},

card:{
backgroundColor:'#fff',
borderRadius:16,
overflow:'hidden',
marginBottom:16,
elevation:3
},

cardImageContainer:{height:180},

cardImage:{width:'100%',height:'100%'},

ratingBadge:{
position:'absolute',
top:10,
right:10,
backgroundColor:'#fff',
padding:6,
borderRadius:12,
flexDirection:'row',
alignItems:'center'
},

ratingText:{marginLeft:4,fontWeight:'bold'},

cardContent:{padding:16},

restaurantName:{fontSize:18,fontWeight:'bold'},

restaurantDescription:{color:'#6B7280',marginBottom:12},

orderButton:{
backgroundColor:'#22c55e',
padding:12,
borderRadius:10,
flexDirection:'row',
alignItems:'center',
justifyContent:'center'
},

orderButtonText:{color:'#fff',marginLeft:6,fontWeight:'bold'},

bottomNav:{
flexDirection:'row',
borderTopWidth:1,
borderColor:'#eee'
},

navItem:{flex:1,alignItems:'center',padding:10},

navText:{fontSize:12,color:'#9CA3AF'},
navTextActive:{color:'#22c55e'}

});
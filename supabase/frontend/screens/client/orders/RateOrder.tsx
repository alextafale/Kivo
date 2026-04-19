import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RouteProp } from '@react-navigation/native'
import { AntDesign } from "@expo/vector-icons"
import { RootStackParamList } from '../../../navigation/StacNavigation'
import * as ImagePicker from "expo-image-picker";
import { useAuth } from '../../../application/context/AuthContext'

const TAGS = ["Delicious Food", "Fast Delivery", "Great Packaging", "Eco-friendly"];
type RateOrderNavigationProp = NativeStackNavigationProp<RootStackParamList, 'RateOrder'>
type RateOrderRouteProp = RouteProp<RootStackParamList, 'RateOrder'>


type Props = {
  navigation: RateOrderNavigationProp
  route: RateOrderRouteProp
}

interface StarRatingProps {
  rating: number;
  onRate: (star: number) => void;
  size?: number;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onRate, size = 36 }) => {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onRate(star)} activeOpacity={0.7}>
          <Text style={[styles.star, { fontSize: size, color: star <= rating ? "#2ECC40" : "#D0D0D0" }]}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function RateOrderScreen({ navigation, route }: Props) {
  const orderId = route.params.id;
  const [orderNumber, setOrderNumber] = useState("");
  const [total, setTotal] = useState(0);
  console.log("Estas en rate order screen");
  const { session } = useAuth();
  const [branchId, setBranchId] = useState("");
  const [driverId, setDriverId] = useState("");

  const [overallRating, setOverallRating] = useState(4);
  const [foodRating, setFoodRating] = useState(4);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(["Delicious Food", "Great Packaging"]);
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imagesUri, setImagesUri] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const pickImage = async () => {
    if (imagesUri.length >= 5) {
      Alert.alert("Límite alcanzado", "Máximo 5 imágenes");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newUris = result.assets.map(asset => asset.uri);
      setImagesUri(prev => [...prev, ...newUris].slice(0, 5));
    }
  };

  useEffect(() => {
    const getOrder = async () => {
      try {
        const response = await fetch(`${process.env.API_BASE_URL}/pedidos/${orderId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.accessToken}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setBranchId(data.sucursal_id);
          setDriverId(data.repartidor_id);
          setOrderNumber(data.order_number);
          setTotal(data.total);
        } else {
          console.log('Error al obtener el pedido');
        }
      } catch (e) {
        console.error(e);
        console.log('Error al obtener el pedido');
      }
    }

    getOrder();

  }, []);

  const buildFormData = () => {
    const formData = new FormData();

    formData.append("pedido_id", orderId);
    formData.append("sucursal_id", branchId);
    formData.append("repartidor_id", driverId);
    formData.append("rating_comida", foodRating.toString());
    formData.append("rating_entrega", deliveryRating.toString());
    formData.append("rating_general", overallRating.toString());
    formData.append("comentario", comment);
    formData.append("es_anonima", isAnonymous ? "true" : "false");

    if (imagesUri.length > 0) {
      for (let i = 0; i < imagesUri.length; i++) {
        formData.append("image_reviews", {
          uri: imagesUri[i],
          name: `image_${i}.jpg`,
          type: "image/jpeg",
        } as any);
      }
    }

    return formData;
  };


  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      if (!branchId) {
        Alert.alert("Error", "No se pudo obtener la sucursal");
        return;
      }

      const formData = buildFormData();
      const res = await fetch(
        `${process.env.API_BASE_URL}/reviews`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session?.accessToken}`
          },
          body: formData,
        }
      );

      if (res.ok) {
        Alert.alert("Review Saved", "Your review has been saved successfully.");
        navigation.navigate("Orders");
      } else if (res.status === 409) {
        Alert.alert("Error", "You have already reviewed this order.");
      } else {
        Alert.alert("Error", "There was an error saving your review.");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "There was an error saving your review.");
    } finally {
      setIsSaving(false);
    }

  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F6F0" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.7} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Your Order</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* Overall Rating */}
          <View style={styles.overallSection}>
            <Text style={styles.overallTitle}>How was your meal?</Text>
            <Text style={styles.overallSub}>Tap a star to rate your overall experience</Text>
            <StarRating rating={overallRating} onRate={setOverallRating} size={44} />
          </View>

          {/* Restaurant Card */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarEmoji}>🍕</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>Food</Text>
                <Text style={styles.cardSub}>How was the food?</Text>
              </View>
            </View>
            <StarRating rating={foodRating} onRate={setFoodRating} size={28} />
          </View>

          {/* Delivery Card */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.avatarCircle, { backgroundColor: "#E8F5E9" }]}>
                <Text style={styles.avatarEmoji}>🛵</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>Delivery</Text>
                <Text style={styles.cardSub}>How was the delivery?</Text>
              </View>
            </View>
            <StarRating rating={deliveryRating} onRate={setDeliveryRating} size={28} />
          </View>

          {/* Images */}
          <View style={[styles.section, { marginTop: 20 }]}>
            <Text style={styles.sectionTitle}>Add photos</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.imagesRow}>

                {/* Botón agregar */}
                <TouchableOpacity
                  style={styles.addImageBtn}
                  onPress={pickImage}
                  activeOpacity={0.8}
                >
                  <AntDesign
                    name="plus"
                    size={24}
                    color="#818181"
                  />
                  <Text style={styles.addImageText}>Add</Text>
                </TouchableOpacity>

                {/* Previews */}
                {imagesUri.map((uri, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image source={{ uri }} style={styles.imagePreview} />

                    {/* Botón eliminar */}
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      onPress={() =>
                        setImagesUri(prev => prev.filter((_, i) => i !== index))
                      }
                    >
                      <Text style={styles.removeImageText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}

              </View>
            </ScrollView>
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What did you like?</Text>
            <View style={styles.tagsWrap}>
              {TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    activeOpacity={0.8}
                    style={[styles.tag, active && styles.tagActive]}
                  >
                    <Text style={[styles.tagText, active && styles.tagTextActive]}>{tag}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Comment */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Leave a comment</Text>
            <TextInput
              style={styles.textInput}
              placeholder="How was your food? Share your experience with others..."
              placeholderTextColor="#ABABAB"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => navigation.navigate('ReportarProblema', {
              orderId: orderId,
              orderNumber: orderNumber,
              total: total,
            })}
          >
            <Text style={styles.reportButtonText}>⚠️ Reportar un problema</Text>
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            Your feedback helps us improve Kivu for everyone.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Submit */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={isSaving}
        >
          <Text style={styles.submitText}>{isSaving ? "Saving..." : "Submit Review"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const screenHeight = Dimensions.get("screen").height;
const screenWidth = Dimensions.get("screen").width;


const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F4F6F0",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#F4F6F0",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EAECE5",
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    fontSize: 20,
    color: "#222",
    lineHeight: 24,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
    letterSpacing: 0.2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  overallSection: {
    alignItems: "center",
    paddingVertical: 28,
  },
  overallTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1A1A1A",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  overallSub: {
    fontSize: 14,
    color: "#888",
    marginTop: 6,
    marginBottom: 18,
    textAlign: "center",
  },
  starsRow: {
    flexDirection: "row",
    gap: 6,
  },
  star: {
    lineHeight: undefined,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFF3E0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarEmoji: {
    fontSize: 26,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  cardSub: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  section: {
    marginTop: 24,
    marginBottom: 8,
    alignItems: 'center',
    alignContent: 'center'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 14,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tag: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: "#D0D0D0",
    backgroundColor: "#FFFFFF",
  },
  tagActive: {
    borderColor: "#2ECC40",
    backgroundColor: "#F0FFF2",
  },
  tagText: {
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
  },
  tagTextActive: {
    color: "#1A8C2A",
    fontWeight: "700",
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    width: screenWidth * 0.9,
    borderColor: "#E0E0E0",
    padding: 16,
    fontSize: 14,
    color: "#333",
    minHeight: 110,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  footerNote: {
    textAlign: "center",
    fontSize: 12,
    color: "#AAA",
    marginTop: 20,
    marginBottom: 8,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#F4F6F0",
  },
  submitBtn: {
    backgroundColor: "#2ECC40",
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#2ECC40",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  submitText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: 0.3,
  },
  imagesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  addImageBtn: {
    width: 90,
    height: 90,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#D0D0D0",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  addImageIcon: {
    fontSize: 26,
  },

  addImageText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },

  imageWrapper: {
    position: "relative",
  },

  imagePreview: {
    width: 90,
    height: 90,
    borderRadius: 16,
  },

  removeImageBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#000",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },

  removeImageText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  reportButton: { paddingVertical: 14, alignItems: 'center' },
  reportButtonText: { fontSize: 14, color: '#F97316', fontWeight: '600' },
  ratingContainer: {
    alignItems: 'center',
    marginVertical: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    // Un sombreado ligero para que resalte
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
});
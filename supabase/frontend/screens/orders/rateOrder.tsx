import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Image,
  StatusBar,
} from "react-native";

const TAGS = ["Delicious Food", "Fast Delivery", "Great Packaging", "Eco-friendly"];

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

export default function RateOrderScreen() {
  const [overallRating, setOverallRating] = useState(4);
  const [foodRating, setFoodRating] = useState(4);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(["Delicious Food", "Great Packaging"]);
  const [comment, setComment] = useState("");

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    console.log({ overallRating, foodRating, deliveryRating, selectedTags, comment });
    alert("¡Gracias por tu reseña!");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F6F0" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Your Order</Text>
        <View style={{ width: 40 }} />
      </View>

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
              <Text style={styles.cardName}>Pizza Paradiso</Text>
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
              <Text style={styles.cardName}>Alex M.</Text>
              <Text style={styles.cardSub}>How was the delivery?</Text>
            </View>
          </View>
          <StarRating rating={deliveryRating} onRate={setDeliveryRating} size={28} />
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

        <Text style={styles.footerNote}>
          Your feedback helps us improve Kivu for everyone.
        </Text>
      </ScrollView>

      {/* Submit */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.85}>
          <Text style={styles.submitText}>Submit Review</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

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
    marginTop: 8,
    marginBottom: 8,
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
});
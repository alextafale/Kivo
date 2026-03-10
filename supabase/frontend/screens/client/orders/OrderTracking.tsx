import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Dimensions,
} from "react-native";

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/StacNavigation";

const { width } = Dimensions.get("window");

type Props = NativeStackScreenProps<RootStackParamList, 'orderTracking'>;


type OrderStatus = "confirmed" | "preparing" | "on_the_way" | "delivered";

interface Step {
  key: OrderStatus;
  label: string;
  sublabel: string;
  emoji: string;
  time: string;
}

const STEPS: Step[] = [
  {
    key: "confirmed",
    label: "Order Confirmed",
    sublabel: "Your order has been received",
    emoji: "✅",
    time: "2:14 PM",
  },
  {
    key: "preparing",
    label: "Preparing Your Food",
    sublabel: "Pizza Paradiso is cooking your order",
    emoji: "👨‍🍳",
    time: "2:18 PM",
  },
  {
    key: "on_the_way",
    label: "On the Way",
    sublabel: "Alex M. is heading your way",
    emoji: "🛵",
    time: "2:35 PM",
  },
  {
    key: "delivered",
    label: "Delivered",
    sublabel: "Enjoy your meal!",
    emoji: "🎉",
    time: "--:--",
  },
];

const STATUS_ORDER: OrderStatus[] = ["confirmed", "preparing", "on_the_way", "delivered"];

export default function OrderTrackingScreen({ route, navigation }: Props) {
  const { order } = route.params;
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>("on_the_way");
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const currentIndex = STATUS_ORDER.indexOf(currentStatus);

  useEffect(() => {
    // Pulse animation for active step
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentIndex / (STEPS.length - 1),
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [currentIndex]);

  const progressHeight = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // Demo: tap to advance status
  const advanceStatus = () => {
    if (currentIndex < STATUS_ORDER.length - 1) {
      setCurrentStatus(STATUS_ORDER[currentIndex + 1]);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F6F0" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn} 
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Tracking</Text>
        <TouchableOpacity style={styles.helpBtn} activeOpacity={0.7}>
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ETA Banner */}
        <View style={styles.etaBanner}>
          <View style={styles.etaLeft}>
            <Text style={styles.etaLabel}>Estimated Arrival</Text>
            <Text style={styles.etaTime}>2:45 PM</Text>
            <Text style={styles.etaMin}>~10 min away</Text>
          </View>
          <View style={styles.etaDivider} />
          <View style={styles.etaRight}>
            <Text style={styles.etaEmoji}>🛵</Text>
            <View style={[styles.statusBadge]}>
              <View style={styles.statusDot} />
              <Text style={styles.statusBadgeText}>On the Way</Text>
            </View>
          </View>
        </View>

        {/* Map Placeholder */}
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapEmoji}>🗺️</Text>
          <Text style={styles.mapText}>Live Map</Text>
          <Text style={styles.mapSub}>Tracking Alex M. in real time</Text>
        </View>

        {/* Delivery Info */}
        <View style={styles.deliveryCard}>
          <View style={styles.deliveryRow}>
            <View style={styles.deliveryAvatar}>
              <Text style={styles.deliveryEmoji}>🧑‍🦱</Text>
            </View>
            <View style={styles.deliveryInfo}>
              <Text style={styles.deliveryName}>Alex M.</Text>
              <Text style={styles.deliverySub}>Your delivery driver</Text>
            </View>
            <TouchableOpacity style={styles.callBtn} activeOpacity={0.8}>
              <Text style={styles.callIcon}>📞</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chatBtn} activeOpacity={0.8}>
              <Text style={styles.chatIcon}>💬</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Steps Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Order Progress</Text>

          <View style={styles.timeline}>
            {/* Background track */}
            <View style={styles.trackBg} />
            {/* Animated fill */}
            <Animated.View style={[styles.trackFill, { height: progressHeight }]} />

            {STEPS.map((step, index) => {
              const isDone = index < currentIndex;
              const isActive = index === currentIndex;
              const isPending = index > currentIndex;

              return (
                <View key={step.key} style={styles.stepRow}>
                  {/* Circle indicator */}
                  <View style={styles.stepIndicatorCol}>
                    {isActive ? (
                      <Animated.View
                        style={[
                          styles.stepCircle,
                          styles.stepCircleActive,
                          { transform: [{ scale: pulseAnim }] },
                        ]}
                      >
                        <Text style={styles.stepEmoji}>{step.emoji}</Text>
                      </Animated.View>
                    ) : (
                      <View
                        style={[
                          styles.stepCircle,
                          isDone && styles.stepCircleDone,
                          isPending && styles.stepCirclePending,
                        ]}
                      >
                        <Text style={[styles.stepEmoji, isPending && { opacity: 0.4 }]}>
                          {isDone ? "✓" : step.emoji}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Step content */}
                  <View style={styles.stepContent}>
                    <Text
                      style={[
                        styles.stepLabel,
                        isDone && styles.stepLabelDone,
                        isActive && styles.stepLabelActive,
                        isPending && styles.stepLabelPending,
                      ]}
                    >
                      {step.label}
                    </Text>
                    <Text style={[styles.stepSublabel, isPending && { opacity: 0.4 }]}>
                      {step.sublabel}
                    </Text>
                  </View>

                  {/* Time */}
                  <Text style={[styles.stepTime, isPending && { opacity: 0.3 }]}>
                    {step.time}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.orderCard}>
          <Text style={styles.sectionTitle}>Your Order</Text>
          <View style={styles.orderRow}>
            <Text style={styles.orderEmoji}>🍕</Text>
            <View style={styles.orderInfo}>
              <Text style={styles.orderItemName}>Margherita Pizza</Text>
              <Text style={styles.orderItemSub}>Pizza Paradiso · x1</Text>
            </View>
            <Text style={styles.orderPrice}>$12.99</Text>
          </View>
          <View style={styles.orderRow}>
            <Text style={styles.orderEmoji}>🥤</Text>
            <View style={styles.orderInfo}>
              <Text style={styles.orderItemName}>Cola Zero</Text>
              <Text style={styles.orderItemSub}>Pizza Paradiso · x2</Text>
            </View>
            <Text style={styles.orderPrice}>$3.50</Text>
          </View>
          <View style={styles.orderDivider} />
          <View style={styles.orderTotalRow}>
            <Text style={styles.orderTotalLabel}>Total</Text>
            <Text style={styles.orderTotalValue}>$16.49</Text>
          </View>
        </View>

        {/* Demo button */}
        <TouchableOpacity style={styles.demoBtn} onPress={advanceStatus} activeOpacity={0.8}>
          <Text style={styles.demoBtnText}>▶ Simulate Next Step (Demo)</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F6F0" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#F4F6F0",
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#EAECE5",
    alignItems: "center", justifyContent: "center",
  },
  backArrow: { fontSize: 20, color: "#222", lineHeight: 24 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#1A1A1A", letterSpacing: 0.2 },
  helpBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: "#EAECE5",
  },
  helpText: { fontSize: 13, fontWeight: "600", color: "#444" },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 32 },

  // ETA Banner
  etaBanner: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  etaLeft: { flex: 1 },
  etaLabel: { fontSize: 12, color: "#888", fontWeight: "500", marginBottom: 4 },
  etaTime: { fontSize: 32, fontWeight: "800", color: "#1A1A1A", letterSpacing: -1 },
  etaMin: { fontSize: 13, color: "#2ECC40", fontWeight: "600", marginTop: 2 },
  etaDivider: { width: 1, height: 60, backgroundColor: "#EBEBEB", marginHorizontal: 20 },
  etaRight: { alignItems: "center", gap: 8 },
  etaEmoji: { fontSize: 36 },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#E8FFF0", paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 50,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#2ECC40" },
  statusBadgeText: { fontSize: 12, fontWeight: "700", color: "#1A8C2A" },

  // Map
  mapPlaceholder: {
    backgroundColor: "#E4EDE0",
    borderRadius: 18,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  mapEmoji: { fontSize: 40, marginBottom: 6 },
  mapText: { fontSize: 16, fontWeight: "700", color: "#3A5C30" },
  mapSub: { fontSize: 12, color: "#6A8C60", marginTop: 2 },

  // Delivery card
  deliveryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  deliveryRow: { flexDirection: "row", alignItems: "center" },
  deliveryAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "#F0F0F0", alignItems: "center", justifyContent: "center",
    marginRight: 12,
  },
  deliveryEmoji: { fontSize: 26 },
  deliveryInfo: { flex: 1 },
  deliveryName: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  deliverySub: { fontSize: 12, color: "#888", marginTop: 2 },
  callBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#E8FFF0", alignItems: "center", justifyContent: "center",
    marginLeft: 8,
  },
  callIcon: { fontSize: 18 },
  chatBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center",
    marginLeft: 8,
  },
  chatIcon: { fontSize: 18 },

  // Timeline
  timelineSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A1A", marginBottom: 18 },

  timeline: {
    position: "relative",
    paddingLeft: 0,
  },
  trackBg: {
    position: "absolute",
    left: 19,
    top: 20,
    bottom: 20,
    width: 3,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
  },
  trackFill: {
    position: "absolute",
    left: 19,
    top: 20,
    width: 3,
    backgroundColor: "#2ECC40",
    borderRadius: 2,
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  stepIndicatorCol: {
    width: 40,
    alignItems: "center",
  },
  stepCircle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#F0F0F0",
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  stepCircleActive: {
    backgroundColor: "#2ECC40",
    borderColor: "#2ECC40",
    shadowColor: "#2ECC40",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  stepCircleDone: {
    backgroundColor: "#E8FFF0",
    borderColor: "#2ECC40",
  },
  stepCirclePending: {
    backgroundColor: "#F8F8F8",
    borderColor: "#E0E0E0",
  },
  stepEmoji: { fontSize: 18 },

  stepContent: { flex: 1, marginLeft: 14 },
  stepLabel: { fontSize: 14, fontWeight: "700", color: "#333" },
  stepLabelActive: { color: "#1A8C2A", fontSize: 15 },
  stepLabelDone: { color: "#2ECC40" },
  stepLabelPending: { color: "#AAAAAA" },
  stepSublabel: { fontSize: 12, color: "#888", marginTop: 2 },
  stepTime: { fontSize: 12, color: "#AAA", fontWeight: "500" },

  // Order Card
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  orderEmoji: { fontSize: 28, marginRight: 12 },
  orderInfo: { flex: 1 },
  orderItemName: { fontSize: 14, fontWeight: "700", color: "#1A1A1A" },
  orderItemSub: { fontSize: 12, color: "#888", marginTop: 2 },
  orderPrice: { fontSize: 14, fontWeight: "700", color: "#333" },
  orderDivider: { height: 1, backgroundColor: "#F0F0F0", marginVertical: 10 },
  orderTotalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderTotalLabel: { fontSize: 15, fontWeight: "700", color: "#555" },
  orderTotalValue: { fontSize: 18, fontWeight: "800", color: "#1A1A1A" },

  // Demo
  demoBtn: {
    backgroundColor: "#1A1A1A",
    borderRadius: 50,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  demoBtnText: { fontSize: 13, fontWeight: "600", color: "#FFF", letterSpacing: 0.3 },
});
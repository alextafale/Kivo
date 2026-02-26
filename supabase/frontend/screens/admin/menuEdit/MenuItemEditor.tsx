import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Image,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Svg, { Path, Circle, Polyline, Line } from 'react-native-svg';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation/StacNavigation';
import BottomNavBar, { TabName } from '../../../components/business/tabNavigation';

type MenuItemEditorNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MenuItemEditor'>;
type MenuItemEditorRouteProp = RouteProp<RootStackParamList, 'MenuItemEditor'>;

type Props = {
  navigation: MenuItemEditorNavigationProp;
  route: MenuItemEditorRouteProp;
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 12H5M12 5l-7 7 7 7" />
  </Svg>
);

const CameraIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <Circle cx="12" cy="13" r="4" />
  </Svg>
);

const TrashIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="3 6 5 6 21 6" />
    <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <Path d="M10 11v6M14 11v6" />
    <Path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </Svg>
);

const CheckIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6L9 17l-5-5" />
  </Svg>
);

const DollarIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
    <Line x1="12" y1="1" x2="12" y2="23" />
    <Path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </Svg>
);

// ─── Mock data loader (replace with real fetch by itemId) ─────────────────────

const getMockItem = (itemId: string) => ({
  id: itemId,
  name: 'Classic Margherita',
  description: 'Fresh tomato sauce, mozzarella, and basil on a hand-tossed crust.',
  price: '14.50',
  category: 'Main Course',
  imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',
  enabled: true,
  soldOut: false,
  preparationTime: '15',
  calories: '820',
  tags: ['Vegetarian', 'Bestseller'],
});

// ─── Tag Pill ─────────────────────────────────────────────────────────────────

const TAG_OPTIONS = ['Vegetarian', 'Vegan', 'Spicy', 'Gluten-Free', 'Bestseller', 'New', 'Featured'];

const TagPill = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.tagPill, selected && styles.tagPillActive]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    {selected && (
      <View style={styles.tagCheck}>
        <Svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
          <Path d="M20 6L9 17l-5-5" />
        </Svg>
      </View>
    )}
    <Text style={[styles.tagPillText, selected && styles.tagPillTextActive]}>{label}</Text>
  </TouchableOpacity>
);

// ─── Field Label ──────────────────────────────────────────────────────────────

const FieldLabel = ({ label, required }: { label: string; required?: boolean }) => (
  <View style={styles.fieldLabelRow}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {required && <Text style={styles.fieldRequired}>*</Text>}
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MenuItemEditor({ navigation, route }: Props) {
  const { itemId } = route.params;
  const initial = getMockItem(itemId);

  const [name, setName]               = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [price, setPrice]             = useState(initial.price);
  const [category, setCategory]       = useState(initial.category);
  const [prepTime, setPrepTime]       = useState(initial.preparationTime);
  const [calories, setCalories]       = useState(initial.calories);
  const [enabled, setEnabled]         = useState(initial.enabled);
  const [soldOut, setSoldOut]         = useState(initial.soldOut);
  const [tags, setTags]               = useState<string[]>(initial.tags);
  const [imageUrl]                    = useState(initial.imageUrl);
  const [hasChanges, setHasChanges]   = useState(false);
  const [activeTab, setActiveTab]     = useState<TabName>('Menu');

  const mark = () => setHasChanges(true);

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    mark();
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a name for this item.');
      return;
    }
    if (!price.trim() || isNaN(parseFloat(price))) {
      Alert.alert('Required', 'Please enter a valid price.');
      return;
    }
    // TODO: persist changes
    Alert.alert('Saved!', 'Menu item updated successfully.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to remove "${name}" from your menu?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const CATEGORIES = ['Main Course', 'Sides', 'Drinks', 'Desserts', 'Appetizers'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F7F2" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <BackIcon />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Edit Item</Text>
          {hasChanges && <View style={styles.unsavedDot} />}
        </View>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <TrashIcon />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Image Upload ── */}
          <View style={styles.imageSection}>
            <TouchableOpacity style={styles.imageWrapper} activeOpacity={0.85}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.itemImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <CameraIcon />
                  <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                </View>
              )}
              <View style={styles.imageEditBadge}>
                <CameraIcon />
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Availability Toggles ── */}
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>Item Available</Text>
                <Text style={styles.toggleSubtext}>Show this item to customers</Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={(v) => { setEnabled(v); mark(); }}
                trackColor={{ false: '#E5E7EB', true: '#22c55e' }}
                thumbColor="#fff"
                ios_backgroundColor="#E5E7EB"
              />
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.toggleRow}>
              <View>
                <Text style={[styles.toggleLabel, soldOut && styles.toggleLabelWarn]}>Sold Out</Text>
                <Text style={styles.toggleSubtext}>Temporarily unavailable</Text>
              </View>
              <Switch
                value={soldOut}
                onValueChange={(v) => { setSoldOut(v); mark(); }}
                trackColor={{ false: '#E5E7EB', true: '#F59E0B' }}
                thumbColor="#fff"
                ios_backgroundColor="#E5E7EB"
              />
            </View>
          </View>

          {/* ── Basic Info ── */}
          <View style={styles.sectionBlock}>
            <Text style={styles.blockTitle}>Basic Info</Text>

            <View style={styles.card}>
              <FieldLabel label="Item Name" required />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={(v) => { setName(v); mark(); }}
                placeholder="e.g. Classic Margherita"
                placeholderTextColor="#9CA3AF"
                returnKeyType="next"
              />

              <View style={styles.fieldGap} />
              <FieldLabel label="Description" />
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={(v) => { setDescription(v); mark(); }}
                placeholder="Describe the dish, ingredients, flavours..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* ── Pricing ── */}
          <View style={styles.sectionBlock}>
            <Text style={styles.blockTitle}>Pricing</Text>
            <View style={styles.card}>
              <FieldLabel label="Price" required />
              <View style={styles.inputWithPrefix}>
                <View style={styles.inputPrefix}>
                  <DollarIcon />
                </View>
                <TextInput
                  style={[styles.input, styles.inputPrefixed]}
                  value={price}
                  onChangeText={(v) => { setPrice(v); mark(); }}
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
              </View>
            </View>
          </View>

          {/* ── Category ── */}
          <View style={styles.sectionBlock}>
            <Text style={styles.blockTitle}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                  onPress={() => { setCategory(cat); mark(); }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── Details ── */}
          <View style={styles.sectionBlock}>
            <Text style={styles.blockTitle}>Details</Text>
            <View style={styles.card}>
              <View style={styles.detailsRow}>
                <View style={styles.detailField}>
                  <FieldLabel label="Prep Time (min)" />
                  <TextInput
                    style={styles.input}
                    value={prepTime}
                    onChangeText={(v) => { setPrepTime(v); mark(); }}
                    placeholder="15"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailField}>
                  <FieldLabel label="Calories (kcal)" />
                  <TextInput
                    style={styles.input}
                    value={calories}
                    onChangeText={(v) => { setCalories(v); mark(); }}
                    placeholder="500"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* ── Tags ── */}
          <View style={styles.sectionBlock}>
            <Text style={styles.blockTitle}>Tags</Text>
            <View style={styles.tagsWrapper}>
              {TAG_OPTIONS.map((tag) => (
                <TagPill
                  key={tag}
                  label={tag}
                  selected={tags.includes(tag)}
                  onPress={() => toggleTag(tag)}
                />
              ))}
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Save Button ── */}
      <View style={styles.saveBar}>
        <TouchableOpacity
          style={[styles.saveButton, !hasChanges && styles.saveButtonDim]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <CheckIcon />
          <Text style={styles.saveButtonText}>
            {hasChanges ? 'Save Changes' : 'No Changes'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ✅ BottomNavBar igual que en BusinessDashboard */}
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GREEN = '#22c55e';
const LIGHT_GREEN = '#F0FDF4';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F7F2',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  unsavedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  deleteButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  // Image
  imageSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imageWrapper: {
    width: 160,
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePlaceholderText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  imageEditBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },

  // Toggles
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  toggleLabelWarn: {
    color: '#D97706',
  },
  toggleSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // Section block
  sectionBlock: {
    marginBottom: 20,
  },
  blockTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1.2,
    marginBottom: 10,
    paddingLeft: 2,
  },

  // Field
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 3,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  fieldRequired: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  fieldGap: {
    height: 14,
  },

  // Inputs
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  textArea: {
    height: 96,
    paddingTop: 12,
  },
  inputWithPrefix: {
    position: 'relative',
  },
  inputPrefix: {
    position: 'absolute',
    left: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 1,
  },
  inputPrefixed: {
    paddingLeft: 38,
  },

  // Category chips
  categoryRow: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  categoryChipTextActive: {
    color: '#fff',
  },

  // Details grid
  detailsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailField: {
    flex: 1,
  },
  detailDivider: {
    width: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },

  // Tags
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 5,
  },
  tagPillActive: {
    backgroundColor: LIGHT_GREEN,
    borderColor: GREEN,
  },
  tagCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  tagPillTextActive: {
    color: '#166534',
  },

  // Save bar
  saveBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    backgroundColor: '#F2F7F2',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GREEN,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  saveButtonDim: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
});
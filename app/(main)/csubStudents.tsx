import { useThemeColors } from "@/assets/styles";
import { Button } from "@/components/button";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CSUBStudents() {
  const colors = useThemeColors();

  const openWebsite = () => {
    Linking.openURL("https://csub.edu/caen/");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          <Text style={styles.backText}>Back to Smart Health</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <View style={styles.heroIconContainer}>
              <Ionicons name="cube" size={40} color="#003594" />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Runner Pantry</Text>
              <Text style={styles.heroSubtitle}>California State University, Bakersfield</Text>
            </View>
          </View>
        </View>

        {/* Mission Statement */}
        <View style={styles.missionCard}>
          <Text style={styles.missionText}>
            Supporting CSUB students with nutritious food and essential resources. We're here to help you succeed academically while maintaining your health and wellness.
          </Text>
          <Button
            title="Visit Food Pantry Website"
            onPress={openWebsite}
            size="lg"
            bg="#FFC72C"
            color="#003594"
            style={styles.websiteButton}
          />
        </View>

        {/* What We Offer */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="nutrition" size={24} color="#003594" />
            <Text style={styles.sectionTitle}>What We Offer</Text>
          </View>

          <View style={styles.offerGrid}>
            <View style={[styles.offerCard, styles.offerCardBlue]}>
              <Text style={styles.offerTitle}>Fresh Produce</Text>
              <Text style={styles.offerDescription}>Fruits, vegetables, and healthy snacks</Text>
            </View>

            <View style={[styles.offerCard, styles.offerCardYellow]}>
              <Text style={[styles.offerTitle, styles.offerTitleDark]}>Pantry Staples</Text>
              <Text style={[styles.offerDescription, styles.offerDescriptionDark]}>
                Canned goods, pasta, rice, and grains
              </Text>
            </View>

            <View style={[styles.offerCard, styles.offerCardBlue]}>
              <Text style={styles.offerTitle}>Protein Sources</Text>
              <Text style={styles.offerDescription}>Beans, nuts, and shelf-stable proteins</Text>
            </View>

            <View style={[styles.offerCard, styles.offerCardYellow]}>
              <Text style={[styles.offerTitle, styles.offerTitleDark]}>Hygiene Products</Text>
              <Text style={[styles.offerDescription, styles.offerDescriptionDark]}>
                Personal care and household items
              </Text>
            </View>
          </View>
        </View>

        {/* What's Available This Week */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="basket" size={24} color="#003594" />
            <Text style={styles.sectionTitle}>What's Available This Week</Text>
          </View>

          <View style={styles.availableGrid}>
            <View style={styles.availableCard}>
              <Text style={styles.availableCategory}>Grains & Pasta</Text>
              <View style={styles.itemList}>
                <Text style={styles.itemText}>• Brown Rice</Text>
                <Text style={styles.itemText}>• Whole Wheat Pasta</Text>
                <Text style={styles.itemText}>• Quinoa</Text>
                <Text style={styles.itemText}>• Oatmeal</Text>
                <Text style={styles.itemText}>• Bread</Text>
              </View>
            </View>

            <View style={styles.availableCard}>
              <Text style={styles.availableCategory}>Canned Goods</Text>
              <View style={styles.itemList}>
                <Text style={styles.itemText}>• Black Beans</Text>
                <Text style={styles.itemText}>• Chickpeas</Text>
                <Text style={styles.itemText}>• Diced Tomatoes</Text>
                <Text style={styles.itemText}>• Corn</Text>
                <Text style={styles.itemText}>• Tuna</Text>
              </View>
            </View>

            <View style={styles.availableCard}>
              <Text style={styles.availableCategory}>Proteins</Text>
              <View style={styles.itemList}>
                <Text style={styles.itemText}>• Peanut Butter</Text>
                <Text style={styles.itemText}>• Almond Butter</Text>
                <Text style={styles.itemText}>• Canned Chicken</Text>
                <Text style={styles.itemText}>• Lentils</Text>
                <Text style={styles.itemText}>• Eggs</Text>
              </View>
            </View>

            <View style={styles.availableCard}>
              <Text style={styles.availableCategory}>Fresh Produce</Text>
              <View style={styles.itemList}>
                <Text style={styles.itemText}>• Apples</Text>
                <Text style={styles.itemText}>• Bananas</Text>
                <Text style={styles.itemText}>• Carrots</Text>
                <Text style={styles.itemText}>• Lettuce</Text>
                <Text style={styles.itemText}>• Tomatoes</Text>
              </View>
            </View>

            <View style={styles.availableCard}>
              <Text style={styles.availableCategory}>Dairy & Alternatives</Text>
              <View style={styles.itemList}>
                <Text style={styles.itemText}>• Milk</Text>
                <Text style={styles.itemText}>• Yogurt</Text>
                <Text style={styles.itemText}>• Cheese</Text>
                <Text style={styles.itemText}>• Almond Milk</Text>
                <Text style={styles.itemText}>• Soy Milk</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Wednesday Garden Pop-Up */}
        <View style={[styles.section, styles.gardenSection]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="leaf" size={24} color="#16A34A" />
            <Text style={styles.sectionTitle}>Wednesday Edible Garden Pop-Up</Text>
          </View>

          <View style={styles.gardenCard}>
            <View style={styles.gardenTimeCard}>
              <Ionicons name="time" size={24} color="#16A34A" style={{ marginBottom: 8 }} />
              <Text style={styles.gardenTimeTitle}>Every Wednesday</Text>
              <Text style={styles.gardenTimeText}>11:00 AM - 2:00 PM</Text>
              <Text style={styles.gardenTimeText}>Student Union Plaza</Text>
            </View>

            <Text style={styles.gardenSectionTitle}>Fresh Produce Available:</Text>
            
            <View style={styles.produceGrid}>
              <View style={styles.produceItem}>
                <Ionicons name="leaf" size={20} color="#16A34A" />
                <Text style={styles.produceText}>Fresh Lettuce & Greens</Text>
              </View>
              <View style={styles.produceItem}>
                <Ionicons name="leaf" size={20} color="#16A34A" />
                <Text style={styles.produceText}>Cherry Tomatoes</Text>
              </View>
              <View style={styles.produceItem}>
                <Ionicons name="leaf" size={20} color="#16A34A" />
                <Text style={styles.produceText}>Bell Peppers</Text>
              </View>
              <View style={styles.produceItem}>
                <Ionicons name="leaf" size={20} color="#16A34A" />
                <Text style={styles.produceText}>Zucchini</Text>
              </View>
            </View>

            <View style={styles.freeNotice}>
              <Ionicons name="heart" size={20} color="#16A34A" style={{ marginRight: 8 }} />
              <Text style={styles.freeNoticeText}>
                <Text style={styles.freeNoticeBold}>100% Free!</Text> All produce is grown on campus and available to all CSUB students. Bring your own bag and take what you need.
              </Text>
            </View>
          </View>
        </View>

        {/* Recipe Ideas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="restaurant" size={24} color="#003594" />
            <Text style={styles.sectionTitle}>Recipe Ideas Using Pantry Items</Text>
          </View>

          <View style={styles.recipeGrid}>
            <View style={styles.recipeCard}>
              <View style={styles.recipeHeader}>
                <Text style={styles.recipeTitle}>Quick Chickpea Pasta</Text>
                <View style={styles.recipeTime}>
                  <Text style={styles.recipeTimeText}>20 mins</Text>
                </View>
              </View>
              <Text style={styles.recipeLabel}>Ingredients:</Text>
              <View style={styles.ingredientList}>
                <Text style={styles.ingredientTag}>Whole Wheat Pasta</Text>
                <Text style={styles.ingredientTag}>Chickpeas</Text>
                <Text style={styles.ingredientTag}>Diced Tomatoes</Text>
                <Text style={styles.ingredientTag}>Onions</Text>
              </View>
              <Text style={styles.recipeLabel}>Instructions:</Text>
              <Text style={styles.recipeInstructions}>
                Cook pasta. Sauté onions, add chickpeas and tomatoes. Mix with pasta for a quick, nutritious meal.
              </Text>
            </View>

            <View style={styles.recipeCard}>
              <View style={styles.recipeHeader}>
                <Text style={styles.recipeTitle}>Peanut Butter Oatmeal</Text>
                <View style={styles.recipeTime}>
                  <Text style={styles.recipeTimeText}>10 mins</Text>
                </View>
              </View>
              <Text style={styles.recipeLabel}>Ingredients:</Text>
              <View style={styles.ingredientList}>
                <Text style={styles.ingredientTag}>Oatmeal</Text>
                <Text style={styles.ingredientTag}>Peanut Butter</Text>
                <Text style={styles.ingredientTag}>Bananas</Text>
                <Text style={styles.ingredientTag}>Milk</Text>
              </View>
              <Text style={styles.recipeLabel}>Instructions:</Text>
              <Text style={styles.recipeInstructions}>
                Cook oatmeal with milk. Top with sliced bananas and a spoonful of peanut butter for a protein-packed breakfast.
              </Text>
            </View>

            <View style={styles.recipeCard}>
              <View style={styles.recipeHeader}>
                <Text style={styles.recipeTitle}>Rice & Beans Bowl</Text>
                <View style={styles.recipeTime}>
                  <Text style={styles.recipeTimeText}>25 mins</Text>
                </View>
              </View>
              <Text style={styles.recipeLabel}>Ingredients:</Text>
              <View style={styles.ingredientList}>
                <Text style={styles.ingredientTag}>Brown Rice</Text>
                <Text style={styles.ingredientTag}>Black Beans</Text>
                <Text style={styles.ingredientTag}>Corn</Text>
                <Text style={styles.ingredientTag}>Tomatoes</Text>
              </View>
              <Text style={styles.recipeLabel}>Instructions:</Text>
              <Text style={styles.recipeInstructions}>
                Cook rice. Heat beans and corn. Combine with fresh tomatoes for a complete protein meal.
              </Text>
            </View>

            <View style={styles.recipeCard}>
              <View style={styles.recipeHeader}>
                <Text style={styles.recipeTitle}>Veggie Stir-Fry</Text>
                <View style={styles.recipeTime}>
                  <Text style={styles.recipeTimeText}>15 mins</Text>
                </View>
              </View>
              <Text style={styles.recipeLabel}>Ingredients:</Text>
              <View style={styles.ingredientList}>
                <Text style={styles.ingredientTag}>Garden Veggies</Text>
                <Text style={styles.ingredientTag}>Rice</Text>
                <Text style={styles.ingredientTag}>Canned Chicken</Text>
                <Text style={styles.ingredientTag}>Garlic</Text>
              </View>
              <Text style={styles.recipeLabel}>Instructions:</Text>
              <Text style={styles.recipeInstructions}>
                Sauté garden vegetables with chicken. Serve over rice for a quick, healthy dinner.
              </Text>
            </View>
          </View>
        </View>

        {/* Location & Hours */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <View style={styles.infoBox}>
              <View style={styles.infoBoxHeader}>
                <Ionicons name="location" size={24} color="#003594" />
                <Text style={styles.infoBoxTitle}>Location</Text>
              </View>
              <Text style={styles.infoBoxText}>Student Union Building</Text>
              <Text style={styles.infoBoxText}>Room 157</Text>
              <Text style={styles.infoBoxText}>9001 Stockdale Highway</Text>
              <Text style={styles.infoBoxText}>Bakersfield, CA 93311</Text>
            </View>

            <View style={styles.infoBox}>
              <View style={styles.infoBoxHeader}>
                <Ionicons name="time" size={24} color="#FFC72C" />
                <Text style={styles.infoBoxTitle}>Hours</Text>
              </View>
              <View style={styles.hoursRow}>
                <Text style={styles.hoursDay}>Monday - Thursday</Text>
                <Text style={styles.hoursTime}>10am - 6pm</Text>
              </View>
              <View style={styles.hoursRow}>
                <Text style={styles.hoursDay}>Friday</Text>
                <Text style={styles.hoursTime}>10am - 4pm</Text>
              </View>
              <View style={styles.hoursRow}>
                <Text style={styles.hoursDay}>Weekend</Text>
                <Text style={styles.hoursTime}>Closed</Text>
              </View>
            </View>
          </View>

          <View style={styles.eligibilityBox}>
            <View style={styles.infoBoxHeader}>
              <Ionicons name="people" size={24} color="#003594" />
              <Text style={styles.infoBoxTitle}>Eligibility</Text>
            </View>
            <Text style={styles.eligibilityText}>
              The Runner Pantry is available to all currently enrolled CSUB students. Simply bring your valid student ID to access our services.
            </Text>
            <View style={styles.noQuestionsNotice}>
              <Ionicons name="heart" size={20} color="#003594" style={{ marginRight: 8 }} />
              <Text style={styles.noQuestionsText}>
                <Text style={styles.noQuestionsBold}>No questions asked.</Text> We believe every student deserves access to nutritious food. All services are confidential and judgment-free.
              </Text>
            </View>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Contact Us</Text>
          
          <View style={styles.contactItem}>
            <Ionicons name="call" size={24} color="#003594" />
            <View style={styles.contactText}>
              <Text style={styles.contactValue}>(661) 654-3036</Text>
              <Text style={styles.contactLabel}>Call for questions or assistance</Text>
            </View>
          </View>

          <View style={styles.contactItem}>
            <Ionicons name="mail" size={24} color="#FFC72C" />
            <View style={styles.contactText}>
              <Text style={styles.contactValue}>foodpantry@csub.edu</Text>
              <Text style={styles.contactLabel}>Email us anytime</Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <Button
              title="Learn More"
              onPress={openWebsite}
              size="lg"
              bg="#003594"
              color="#FFFFFF"
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              title="Back to Smart Health"
              onPress={() => router.back()}
              size="lg"
              bg="#FFFFFF"
              color="#003594"
              style={{ flex: 1, marginLeft: 8, borderWidth: 2, borderColor: "#003594" }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#003594",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContent: {
    paddingBottom: 32,
  },
  heroSection: {
    backgroundColor: "#003594",
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: "#FFC72C",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  missionCard: {
    backgroundColor: "#003594",
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
  },
  missionText: {
    fontSize: 16,
    color: "#FFFFFF",
    lineHeight: 24,
    textAlign: "left",
  },
  websiteButton: {
    marginTop: 8,
  },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  offerGrid: {
    gap: 12,
  },
  offerCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  offerCardBlue: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  offerCardYellow: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#003594",
    marginBottom: 4,
  },
  offerTitleDark: {
    color: "#92400E",
  },
  offerDescription: {
    fontSize: 14,
    color: "#1E40AF",
  },
  offerDescriptionDark: {
    color: "#78350F",
  },
  availableGrid: {
    gap: 12,
  },
  availableCard: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  availableCategory: {
    fontSize: 18,
    fontWeight: "700",
    color: "#003594",
    marginBottom: 12,
  },
  itemList: {
    gap: 6,
  },
  itemText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  gardenSection: {
    backgroundColor: "#F0FDF4",
  },
  gardenCard: {
    gap: 16,
  },
  gardenTimeCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#86EFAC",
  },
  gardenTimeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#16A34A",
    marginBottom: 4,
  },
  gardenTimeText: {
    fontSize: 15,
    color: "#15803D",
    lineHeight: 22,
  },
  gardenSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
  },
  produceGrid: {
    gap: 8,
  },
  produceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  produceText: {
    fontSize: 15,
    color: "#15803D",
    fontWeight: "500",
  },
  freeNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#DCFCE7",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  freeNoticeText: {
    flex: 1,
    fontSize: 14,
    color: "#15803D",
    lineHeight: 20,
  },
  freeNoticeBold: {
    fontWeight: "700",
  },
  recipeGrid: {
    gap: 16,
  },
  recipeCard: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  recipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#003594",
    flex: 1,
  },
  recipeTime: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recipeTimeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
  },
  recipeLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    marginTop: 8,
  },
  ingredientList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ingredientTag: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 13,
    color: "#374151",
  },
  recipeInstructions: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  infoSection: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginTop: 16,
    gap: 16,
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
  },
  infoBox: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoBoxHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  infoBoxTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  infoBoxText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 2,
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  hoursDay: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },
  hoursTime: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "600",
    textAlign: "right",
  },
  eligibilityBox: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  eligibilityText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
    marginBottom: 12,
  },
  noQuestionsNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 8,
  },
  noQuestionsText: {
    flex: 1,
    fontSize: 14,
    color: "#1E40AF",
    lineHeight: 20,
  },
  noQuestionsBold: {
    fontWeight: "700",
  },
  contactSection: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginTop: 16,
    gap: 16,
  },
  contactTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  contactText: {
    flex: 1,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  contactLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
});


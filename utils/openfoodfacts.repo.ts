import { ProductData } from "./types/foodJournal.types";

const BASE_URL = "https://world.openfoodfacts.org/api/v2";

export const fetchProductByBarcode = async (
  barcode: string
): Promise<ProductData | null> => {
  try {
    const response = await fetch(`${BASE_URL}/product/${barcode}.json`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return null;
    }

    const product = data.product;

    const productData: ProductData = {
      barcode,
      productName: product.product_name || "Unknown Product",
      calories: product.nutriments?.["energy-kcal_100g"] || null,
      protein: product.nutriments?.proteins_100g || null,
      carbs: product.nutriments?.carbohydrates_100g || null,
      fat: product.nutriments?.fat_100g || null,
      sugar: product.nutriments?.sugars_100g || null,
      fiber: product.nutriments?.fiber_100g || null,
      sodium: product.nutriments?.sodium_100g || null,
      saturatedFat: product.nutriments?.["saturated-fat_100g"] || null,
      transFat: product.nutriments?.["trans-fat_100g"] || null,
      cholesterol: product.nutriments?.cholesterol_100g || null,
      servingSize: product.serving_size || null,
      ingredients: parseIngredients(product),
    };

    return productData;
  } catch (error) {
    console.error("Error fetching product from Open Food Facts:", error);
    throw error;
  }
};

const parseIngredients = (product: any): string[] => {
  const ingredients: string[] = [];

  if (product.ingredients_text) {
    const rawIngredients = product.ingredients_text
      .split(",")
      .map((i: string) => i.trim())
      .filter((i: string) => i.length > 0);
    ingredients.push(...rawIngredients);
  }

  if (
    product.ingredients &&
    Array.isArray(product.ingredients) &&
    ingredients.length === 0
  ) {
    product.ingredients.forEach((ing: any) => {
      if (ing.text) {
        ingredients.push(ing.text);
      } else if (ing.id) {
        ingredients.push(ing.id.replace("en:", "").replace(/-/g, " "));
      }
    });
  }

  if (product.allergens_tags && Array.isArray(product.allergens_tags)) {
    product.allergens_tags.forEach((allergen: string) => {
      const cleanAllergen = allergen.replace("en:", "").replace(/-/g, " ");
      ingredients.push(cleanAllergen);
    });
  }

  return ingredients;
};
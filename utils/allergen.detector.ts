
// Allergen detection with synonyms and smart matching

export interface AllergenMatch {
  prohibitedIngredient: string;
  foundIn: string[];
  severity: number;
}

// Common allergen synonyms and variations
const ALLERGEN_ALIASES: Record<string, string[]> = {
  // Milk/Dairy
  "milk": ["milk", "dairy", "cream", "butter", "cheese", "whey", "casein", "lactose", "ghee", "buttermilk", "yogurt", "kefir", "curd"],
  "dairy": ["milk", "dairy", "cream", "butter", "cheese", "whey", "casein", "lactose", "ghee", "buttermilk", "yogurt", "kefir", "curd"],
  
  // Eggs
  "egg": ["egg", "eggs", "albumin", "albumen", "ovalbumin", "ovoglobulin", "mayonnaise", "meringue"],
  "eggs": ["egg", "eggs", "albumin", "albumen", "ovalbumin", "ovoglobulin", "mayonnaise", "meringue"],
  
  // Peanuts
  "peanut": ["peanut", "peanuts", "groundnut", "groundnuts", "arachis", "beer nuts", "monkey nuts"],
  "peanuts": ["peanut", "peanuts", "groundnut", "groundnuts", "arachis", "beer nuts", "monkey nuts"],
  
  // Tree Nuts
  "almond": ["almond", "almonds", "marzipan"],
  "almonds": ["almond", "almonds", "marzipan"],
  "walnut": ["walnut", "walnuts"],
  "walnuts": ["walnut", "walnuts"],
  "cashew": ["cashew", "cashews"],
  "cashews": ["cashew", "cashews"],
  "pistachio": ["pistachio", "pistachios"],
  "pistachios": ["pistachio", "pistachios"],
  "pecan": ["pecan", "pecans"],
  "pecans": ["pecan", "pecans"],
  "hazelnut": ["hazelnut", "hazelnuts", "filbert"],
  "hazelnuts": ["hazelnut", "hazelnuts", "filbert"],
  "macadamia": ["macadamia", "macadamias"],
  "brazil nut": ["brazil nut", "brazil nuts"],
  "chestnut": ["chestnut", "chestnuts"],
  
  // Soy
  "soy": ["soy", "soya", "soybean", "soybeans", "tofu", "tempeh", "miso", "edamame", "shoyu", "tamari"],
  "soya": ["soy", "soya", "soybean", "soybeans", "tofu", "tempeh", "miso", "edamame", "shoyu", "tamari"],
  "soybean": ["soy", "soya", "soybean", "soybeans", "tofu", "tempeh", "miso", "edamame", "shoyu", "tamari"],
  
  // Wheat/Gluten
  "wheat": ["wheat", "flour", "semolina", "durum", "spelt", "kamut", "farro", "bulgur", "couscous"],
  "gluten": ["wheat", "barley", "rye", "malt", "brewer's yeast", "seitan", "triticale"],
  "barley": ["barley", "malt"],
  "rye": ["rye"],
  
  // Fish
  "fish": ["fish", "anchovy", "anchovies", "bass", "catfish", "cod", "flounder", "grouper", "haddock", "hake", "halibut", "herring", "mahi mahi", "perch", "pike", "pollock", "salmon", "sardine", "sole", "snapper", "swordfish", "tilapia", "trout", "tuna"],
  "salmon": ["salmon"],
  "tuna": ["tuna"],
  "cod": ["cod"],
  
  // Shellfish
  "shellfish": ["crab", "lobster", "shrimp", "prawn", "crawfish", "crayfish", "clam", "mussel", "oyster", "scallop", "squid", "octopus"],
  "shrimp": ["shrimp", "prawn", "prawns"],
  "crab": ["crab"],
  "lobster": ["lobster"],
  "oyster": ["oyster", "oysters"],
  
  // Sesame
  "sesame": ["sesame", "tahini", "benne", "gingelly", "til"],
  
  // Mustard
  "mustard": ["mustard"],
  
  // Celery
  "celery": ["celery", "celeriac"],
  
  // Sulfites
  "sulfite": ["sulfite", "sulfites", "sulphite", "sulphites", "sulfur dioxide"],
  "sulfites": ["sulfite", "sulfites", "sulphite", "sulphites", "sulfur dioxide"],
  
  // Corn
  "corn": ["corn", "maize", "cornmeal", "cornstarch", "polenta", "hominy", "grits"],
  "maize": ["corn", "maize", "cornmeal", "cornstarch", "polenta", "hominy", "grits"],
};

// Additional patterns to catch variations
const INGREDIENT_PATTERNS: Record<string, RegExp[]> = {
  "milk": [/\bmilk\b/i, /\bdairy\b/i, /\bcream\b/i, /\bwhey\b/i, /\bcasein\b/i, /\blactose\b/i],
  "egg": [/\begg\b/i, /\balbumin\b/i, /\bovo\w+/i],
  "peanut": [/\bpeanut\b/i, /\bgroundnut\b/i, /\barachis\b/i],
  "soy": [/\bsoy\b/i, /\bsoya\b/i, /\btofu\b/i, /\bmiso\b/i],
  "wheat": [/\bwheat\b/i, /\bflour\b/i, /\bgluten\b/i],
  "fish": [/\bfish\b/i, /\banchov\w+/i, /\bsalmon\b/i, /\btuna\b/i],
  "shellfish": [/\bshrimp\b/i, /\bcrab\b/i, /\blobster\b/i, /\bprawn\b/i],
};

/**
 * Normalize ingredient name for matching
 */
function normalizeIngredient(ingredient: string): string {
  return ingredient
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Get all possible aliases for a prohibited ingredient
 */
function getAliases(prohibitedIngredient: string): string[] {
  const normalized = normalizeIngredient(prohibitedIngredient);
  
  // Check if we have predefined aliases
  if (ALLERGEN_ALIASES[normalized]) {
    return ALLERGEN_ALIASES[normalized];
  }
  
  // Otherwise return variations of the word
  const variations: string[] = [normalized];
  
  // Add plural/singular variations
  if (normalized.endsWith('s')) {
    variations.push(normalized.slice(0, -1)); 
  } else {
    variations.push(normalized + 's'); 
  }
  
  return variations;
}

/**
 * Check if a product ingredient contains a prohibited ingredient
 */
function containsAllergen(
  productIngredient: string,
  prohibitedIngredient: string
): boolean {
  const normalizedProduct = normalizeIngredient(productIngredient);
  const normalizedProhibited = normalizeIngredient(prohibitedIngredient);
  
  // Get all aliases for the prohibited ingredient
  const aliases = getAliases(normalizedProhibited);
  
  // Split into words for word-level matching
  const productWords = normalizedProduct.split(/\s+/);
  
  // Check each alias
  for (const alias of aliases) {
    const aliasWords = alias.split(/\s+/);
    
    // Check for exact word match
    for (const aliasWord of aliasWords) {
      for (const productWord of productWords) {
        // Bidirectional substring matching
        if (
          productWord.includes(aliasWord) ||
          aliasWord.includes(productWord) ||
          productWord === aliasWord
        ) {
          return true;
        }
      }
    }
    
    // Check for multi-word phrase match
    if (normalizedProduct.includes(alias)) {
      return true;
    }
  }
  
  // Check regex patterns if available
  const patterns = INGREDIENT_PATTERNS[normalizedProhibited];
  if (patterns) {
    for (const pattern of patterns) {
      if (pattern.test(productIngredient)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Check product ingredients against prohibited ingredients list
 * Returns detailed matches with severity
 */
export function checkForAllergens(
  productIngredients: string[],
  prohibitedIngredients: Array<{ name: string; severity: number }>
): AllergenMatch[] {
  if (!productIngredients || productIngredients.length === 0) {
    return [];
  }
  
  if (!prohibitedIngredients || prohibitedIngredients.length === 0) {
    return [];
  }
  
  const matches: AllergenMatch[] = [];
  
  for (const prohibited of prohibitedIngredients) {
    const foundIn: string[] = [];
    
    for (const ingredient of productIngredients) {
      if (containsAllergen(ingredient, prohibited.name)) {
        foundIn.push(ingredient);
      }
    }
    
    if (foundIn.length > 0) {
      matches.push({
        prohibitedIngredient: prohibited.name,
        foundIn,
        severity: prohibited.severity,
      });
    }
  }
  
  // Sort by severity (highest first)
  return matches.sort((a, b) => b.severity - a.severity);
}

/**
 * Simple check - returns true if any allergens found
 */
export function hasAllergens(
  productIngredients: string[],
  prohibitedIngredients: Array<{ name: string; severity: number }>
): boolean {
  return checkForAllergens(productIngredients, prohibitedIngredients).length > 0;
}

/**
 * Get formatted alert message for allergen warnings
 */
export function getAllergenAlertMessage(matches: AllergenMatch[]): string {
  if (matches.length === 0) {
    return "No allergens detected";
  }
  
  const severityEmoji = (severity: number) => {
    if (severity >= 3) return "🚨";
    if (severity === 2) return "⚠️";
    return "ℹ️";
  };
  
  const messages = matches.map(match => {
    const emoji = severityEmoji(match.severity);
    return `${emoji} ${match.prohibitedIngredient} (found in: ${match.foundIn.join(", ")})`;
  });
  
  return messages.join("\n\n");
}

/**
 * Get severity level text
 */
export function getSeverityText(severity: number): string {
  if (severity >= 3) return "SEVERE";
  if (severity === 2) return "MODERATE";
  return "MILD";
}
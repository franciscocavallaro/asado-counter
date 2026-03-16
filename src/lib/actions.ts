"use server";

import { supabase } from "./supabase";
import type {
  Asado,
  AsadoWithRelations,
  Cut,
  Guest,
  AsadoFormData,
  WrappedStats,
  BarcodeProductInfo,
} from "./types";

interface UpsertBarcodeMappingInput {
  barcode: string;
  cut_name: string;
  default_weight_kg?: number | null;
  brand?: string | null;
}

interface OpenFoodFactsProduct {
  brands?: string;
  categories_tags?: string[];
  generic_name?: string;
  generic_name_es?: string;
  product_name?: string;
  product_name_es?: string;
  product_quantity?: number;
  product_quantity_unit?: string;
  quantity?: string;
}

interface OpenFoodFactsResponse {
  status?: number;
  product?: OpenFoodFactsProduct;
}

// Get all cuts
export async function getCuts(): Promise<Cut[]> {
  const { data, error } = await supabase
    .from("cuts")
    .select("*")
    .order("name");

  if (error) throw error;
  return data || [];
}

// Get all guests
export async function getGuests(): Promise<Guest[]> {
  const { data, error } = await supabase
    .from("guests")
    .select("*")
    .order("name");

  if (error) throw error;
  return data || [];
}

// Create or get a cut by name
export async function getOrCreateCut(name: string): Promise<Cut> {
  const normalizedName = name.trim();

  // Try to find existing cut
  const { data: existing } = await supabase
    .from("cuts")
    .select("*")
    .ilike("name", normalizedName)
    .single();

  if (existing) return existing;

  // Create new cut
  const { data, error } = await supabase
    .from("cuts")
    .insert({ name: normalizedName })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Create or get a guest by name
export async function getOrCreateGuest(name: string): Promise<Guest> {
  const normalizedName = name.trim();

  // Try to find existing guest
  const { data: existing } = await supabase
    .from("guests")
    .select("*")
    .ilike("name", normalizedName)
    .single();

  if (existing) return existing;

  // Create new guest
  const { data, error } = await supabase
    .from("guests")
    .insert({ name: normalizedName })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get all asados with relations
export async function getAsados(): Promise<AsadoWithRelations[]> {
  const { data, error } = await supabase
    .from("asados")
    .select(
      `
      *,
      asado_cuts (
        *,
        cut:cuts (*)
      ),
      asado_guests (
        *,
        guest:guests (*)
      )
    `
    )
    .order("date", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Create a new asado
export async function createAsado(formData: AsadoFormData): Promise<Asado> {
  // Create the asado
  const { data: asado, error: asadoError } = await supabase
    .from("asados")
    .insert({
      date: new Date(formData.date).toISOString().split("T")[0],
      title: formData.title?.trim() || null,
      rating: formData.rating,
      location: formData.location?.trim() || null,
    })
    .select()
    .single();

  if (asadoError) throw asadoError;

  // Process cuts
  for (const cutInput of formData.cuts) {
    const cut = await getOrCreateCut(cutInput.name);
    const { error } = await supabase.from("asado_cuts").insert({
      asado_id: asado.id,
      cut_id: cut.id,
      weight_kg: cutInput.weight_kg,
    });
    if (error) throw error;
  }

  // Process guests
  for (const guestInput of formData.guests) {
    const guest = await getOrCreateGuest(guestInput.name);
    const { error } = await supabase.from("asado_guests").insert({
      asado_id: asado.id,
      guest_id: guest.id,
    });
    if (error) throw error;
  }

  return asado;
}

// Update an asado
export async function updateAsado(
  id: string,
  formData: AsadoFormData
): Promise<Asado> {
  // Update the asado
  const { data: asado, error: asadoError } = await supabase
    .from("asados")
    .update({
      date: new Date(formData.date).toISOString().split("T")[0],
      title: formData.title?.trim() || null,
      rating: formData.rating,
      location: formData.location?.trim() || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (asadoError) throw asadoError;

  // Delete existing cuts and guests
  const { error: deleteCutsError } = await supabase
    .from("asado_cuts")
    .delete()
    .eq("asado_id", id);
  if (deleteCutsError) throw deleteCutsError;

  const { error: deleteGuestsError } = await supabase
    .from("asado_guests")
    .delete()
    .eq("asado_id", id);
  if (deleteGuestsError) throw deleteGuestsError;

  // Process cuts
  for (const cutInput of formData.cuts) {
    const cut = await getOrCreateCut(cutInput.name);
    const { error } = await supabase.from("asado_cuts").insert({
      asado_id: asado.id,
      cut_id: cut.id,
      weight_kg: cutInput.weight_kg,
    });
    if (error) throw error;
  }

  // Process guests
  for (const guestInput of formData.guests) {
    const guest = await getOrCreateGuest(guestInput.name);
    const { error } = await supabase.from("asado_guests").insert({
      asado_id: asado.id,
      guest_id: guest.id,
    });
    if (error) throw error;
  }

  return asado;
}

// Delete an asado
export async function deleteAsado(id: string): Promise<void> {
  const { error } = await supabase.from("asados").delete().eq("id", id);

  if (error) throw error;
}

// Get wrapped statistics
export async function getWrappedStats(year?: number): Promise<WrappedStats> {
  const currentYear = year || new Date().getFullYear();
  const startDate = `${currentYear}-01-01`;
  const endDate = `${currentYear}-12-31`;

  // Get all asados for the year with relations
  const { data: asados, error } = await supabase
    .from("asados")
    .select(
      `
      *,
      asado_cuts (
        *,
        cut:cuts (*)
      ),
      asado_guests (
        *,
        guest:guests (*)
      )
    `
    )
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) throw error;

  if (!asados || asados.length === 0) {
    return {
      totalKg: 0,
      totalAsados: 0,
      totalUniqueGuests: 0,
      averageRating: 0,
      cutRanking: [],
      guestRanking: [],
    };
  }

  // Calculate total kg
  let totalKg = 0;
  const cutStats: Record<string, { count: number; totalKg: number }> = {};
  const guestStats: Record<string, number> = {};
  const uniqueGuests = new Set<string>();

  for (const asado of asados) {
    // Process cuts
    for (const asadoCut of asado.asado_cuts || []) {
      const cutName = asadoCut.cut?.name || "Unknown";
      totalKg += Number(asadoCut.weight_kg);

      if (!cutStats[cutName]) {
        cutStats[cutName] = { count: 0, totalKg: 0 };
      }
      cutStats[cutName].count += 1;
      cutStats[cutName].totalKg += Number(asadoCut.weight_kg);
    }

    // Process guests
    for (const asadoGuest of asado.asado_guests || []) {
      const guestName = asadoGuest.guest?.name || "Unknown";
      uniqueGuests.add(guestName);
      guestStats[guestName] = (guestStats[guestName] || 0) + 1;
    }
  }

  // Calculate average rating
  const averageRating =
    asados.reduce((sum, a) => sum + a.rating, 0) / asados.length;

  // Sort rankings
  const cutRanking = Object.entries(cutStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.count - a.count);

  const guestRanking = Object.entries(guestStats)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalKg: Math.round(totalKg * 100) / 100,
    totalAsados: asados.length,
    totalUniqueGuests: uniqueGuests.size,
    averageRating: Math.round(averageRating * 10) / 10,
    cutRanking,
    guestRanking,
  };
}

const ARGENTINA_CUT_KEYWORDS: Array<{ cut: string; keywords: string[] }> = [
  { cut: "Asado de tira", keywords: ["asado de tira"] },
  { cut: "Bife de chorizo", keywords: ["bife de chorizo"] },
  { cut: "Colita de cuadril", keywords: ["colita de cuadril"] },
  { cut: "Tapa de asado", keywords: ["tapa de asado"] },
  { cut: "Roast beef", keywords: ["roast beef"] },
  { cut: "Bondiola", keywords: ["bondiola"] },
  { cut: "Matambre", keywords: ["matambre"] },
  { cut: "Entraña", keywords: ["entrana", "entraña"] },
  { cut: "Vacío", keywords: ["vacio", "vacío"] },
  { cut: "Cuadril", keywords: ["cuadril"] },
  { cut: "Peceto", keywords: ["peceto"] },
  { cut: "Nalga", keywords: ["nalga"] },
  { cut: "Paleta", keywords: ["paleta"] },
  { cut: "Falda", keywords: ["falda"] },
  { cut: "Chorizo", keywords: ["chorizo"] },
  { cut: "Morcilla", keywords: ["morcilla"] },
  { cut: "Hamburguesa", keywords: ["hamburguesa", "burger"] },
];

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function inferArgentineCutName(productName: string, categories: string[]): string {
  const haystack = normalizeText(
    `${productName} ${categories
      .map((category) => category.replace(/^[a-z]{2}:/i, "").replace(/-/g, " "))
      .join(" ")}`
  );

  for (const mapping of ARGENTINA_CUT_KEYWORDS) {
    if (mapping.keywords.some((keyword) => haystack.includes(normalizeText(keyword)))) {
      return mapping.cut;
    }
  }

  return productName;
}

function parseWeightKg(
  quantityText: string | undefined,
  productQuantity: number | undefined,
  productQuantityUnit: string | undefined
): number | null {
  if (typeof productQuantity === "number" && Number.isFinite(productQuantity) && productQuantity > 0) {
    const normalizedUnit = normalizeText(productQuantityUnit || "g");
    if (normalizedUnit.startsWith("kg")) return Math.round(productQuantity * 1000) / 1000;
    if (normalizedUnit.startsWith("g")) return Math.round((productQuantity / 1000) * 1000) / 1000;
  }

  if (!quantityText) return null;

  const normalizedText = normalizeText(quantityText).replace(/,/g, ".");

  // Match values such as "2 x 500 g".
  const multiMatch = normalizedText.match(/(\d+(?:\.\d+)?)\s*[x*]\s*(\d+(?:\.\d+)?)\s*(kg|g|gr)/);
  if (multiMatch) {
    const packs = parseFloat(multiMatch[1]);
    const each = parseFloat(multiMatch[2]);
    const unit = multiMatch[3];
    if (Number.isFinite(packs) && Number.isFinite(each) && packs > 0 && each > 0) {
      const total = packs * each;
      return unit.startsWith("kg")
        ? Math.round(total * 1000) / 1000
        : Math.round((total / 1000) * 1000) / 1000;
    }
  }

  // Match values such as "500 g" or "1.2 kg".
  const singleMatch = normalizedText.match(/(\d+(?:\.\d+)?)\s*(kg|g|gr)/);
  if (singleMatch) {
    const amount = parseFloat(singleMatch[1]);
    const unit = singleMatch[2];
    if (Number.isFinite(amount) && amount > 0) {
      return unit.startsWith("kg")
        ? Math.round(amount * 1000) / 1000
        : Math.round((amount / 1000) * 1000) / 1000;
    }
  }

  return null;
}

async function getFromOpenFoodFacts(barcode: string): Promise<BarcodeProductInfo | null> {
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`,
    {
      headers: {
        "User-Agent": "asado-counter/1.0 (barcode lookup)",
      },
      next: { revalidate: 60 * 60 * 24 },
    }
  );

  if (!response.ok) return null;

  const payload = (await response.json()) as OpenFoodFactsResponse;
  const product = payload.product;

  if (!product || payload.status !== 1) return null;

  const productName =
    product.product_name_es?.trim() ||
    product.product_name?.trim() ||
    product.generic_name_es?.trim() ||
    product.generic_name?.trim();
  if (!productName) return null;

  const inferredCutName = inferArgentineCutName(productName, product.categories_tags || []);
  const weightKg = parseWeightKg(
    product.quantity,
    product.product_quantity,
    product.product_quantity_unit
  );
  const brand = product.brands?.split(",")[0]?.trim() || null;

  return {
    cut_name: inferredCutName,
    weight_kg: weightKg,
    brand,
  };
}

// Get product info by barcode
export async function getProductByBarcode(
  barcode: string
): Promise<BarcodeProductInfo | null> {
  const normalizedBarcode = barcode.trim();
  if (!normalizedBarcode) return null;

  // 1) Fast local lookup (if table exists)
  const { data, error } = await supabase
    .from("barcode_mappings")
    .select("cut_name, default_weight_kg, brand")
    .eq("barcode", normalizedBarcode)
    .single();

  if (!error && data) {
    return {
      cut_name: data.cut_name,
      weight_kg: data.default_weight_kg,
      brand: data.brand,
    };
  }

  // 2) First-time lookup from external catalog (works without prior learning)
  try {
    const externalProduct = await getFromOpenFoodFacts(normalizedBarcode);
    if (!externalProduct) return null;

    // Optional cache for next scans (best effort; do not fail lookup if it errors)
    const { error: cacheError } = await supabase.from("barcode_mappings").upsert(
      {
        barcode: normalizedBarcode,
        cut_name: externalProduct.cut_name,
        default_weight_kg: externalProduct.weight_kg,
        brand: externalProduct.brand,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "barcode" }
    );
    if (cacheError) {
      console.warn("Barcode cache upsert failed:", cacheError);
    }

    return externalProduct;
  } catch (externalError) {
    console.error("Barcode external lookup failed:", externalError);
    return null;
  }
}

// Create or update a barcode mapping (used to "learn" new products after manual entry)
export async function upsertBarcodeMapping(
  input: UpsertBarcodeMappingInput
): Promise<void> {
  const barcode = input.barcode.trim();
  const cutName = input.cut_name.trim();

  if (!barcode || !cutName) {
    throw new Error("Barcode and cut name are required");
  }

  const { error } = await supabase.from("barcode_mappings").upsert(
    {
      barcode,
      cut_name: cutName,
      default_weight_kg: input.default_weight_kg ?? null,
      brand: input.brand?.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "barcode" }
  );

  if (error) throw error;
}

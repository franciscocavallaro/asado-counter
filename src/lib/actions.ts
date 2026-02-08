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


// Get product info by barcode
export async function getProductByBarcode(
  barcode: string
): Promise<BarcodeProductInfo | null> {
  const { data, error } = await supabase
    .from("barcode_mappings")
    .select("cut_name, default_weight_kg, brand")
    .eq("barcode", barcode.trim())
    .single();

  if (error) {
    // Si no encuentra el código, retornar null (no es un error crítico)
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  if (!data) return null;

  return {
    cut_name: data.cut_name,
    weight_kg: data.default_weight_kg,
    brand: data.brand,
  };
}

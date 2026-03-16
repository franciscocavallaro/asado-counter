"use server";

import { supabase } from "./supabase";
import type {
  Asado,
  AsadoWithRelations,
  AsadoVote,
  Cut,
  Guest,
  AsadoFormData,
  WrappedStats,
} from "./types";

const ASADO_RELATIONS_SELECT = `
  *,
  asado_cuts (
    *,
    cut:cuts (*)
  ),
  asado_guests (
    *,
    guest:guests (*)
  )
`;

const ASADO_RELATIONS_WITH_VOTES_SELECT = `
  ${ASADO_RELATIONS_SELECT},
  asado_votes (
    *
  )
`;

function isAsadoVotesRelationMissing(error: unknown): boolean {
  const message = String((error as { message?: string; details?: string })?.message || "").toLowerCase();
  const details = String((error as { message?: string; details?: string })?.details || "").toLowerCase();
  const full = `${message} ${details}`;

  return full.includes("asado_votes");
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
  const withVotes = await supabase
    .from("asados")
    .select(ASADO_RELATIONS_WITH_VOTES_SELECT)
    .order("date", { ascending: false });

  if (!withVotes.error) {
    return (withVotes.data || []) as AsadoWithRelations[];
  }

  if (!isAsadoVotesRelationMissing(withVotes.error)) {
    throw withVotes.error;
  }

  const withoutVotes = await supabase
    .from("asados")
    .select(ASADO_RELATIONS_SELECT)
    .order("date", { ascending: false });

  if (withoutVotes.error) throw withoutVotes.error;

  return (withoutVotes.data || []).map((asado) => ({
    ...asado,
    asado_votes: [],
  })) as AsadoWithRelations[];
}

// Create a new asado
export async function createAsado(formData: AsadoFormData): Promise<Asado> {
  // Create the asado (new schema uses null rating; older schema requires a value)
  const nullableInsert = await supabase
    .from("asados")
    .insert({
      date: new Date(formData.date).toISOString().split("T")[0],
      title: formData.title?.trim() || null,
      rating: null,
      location: formData.location?.trim() || null,
    })
    .select()
    .single();

  let asado = nullableInsert.data;

  if (nullableInsert.error) {
    const fallbackInsert = await supabase
      .from("asados")
      .insert({
        date: new Date(formData.date).toISOString().split("T")[0],
        title: formData.title?.trim() || null,
        rating: 7,
        location: formData.location?.trim() || null,
      })
      .select()
      .single();

    if (fallbackInsert.error) throw fallbackInsert.error;
    asado = fallbackInsert.data;
  }

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

// Get one asado for voting page
export async function getAsadoForVoting(id: string): Promise<Asado | null> {
  const { data, error } = await supabase
    .from("asados")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

// Submit one vote (1-10)
export async function submitAsadoVote(asadoId: string, score: number): Promise<AsadoVote> {
  const safeScore = Math.max(1, Math.min(10, Math.round(score)));

  const { data, error } = await supabase
    .from("asado_votes")
    .insert({
      asado_id: asadoId,
      score: safeScore,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get wrapped statistics
export async function getWrappedStats(year?: number): Promise<WrappedStats> {
  const currentYear = year || new Date().getFullYear();
  const startDate = `${currentYear}-01-01`;
  const endDate = `${currentYear}-12-31`;

  // Get all asados for the year with relations
  const { data: asados, error } = await supabase
    .from("asados")
    .select(ASADO_RELATIONS_WITH_VOTES_SELECT)
    .gte("date", startDate)
    .lte("date", endDate);

  let wrappedAsados = asados;

  if (error) {
    if (!isAsadoVotesRelationMissing(error)) {
      throw error;
    }

    const fallback = await supabase
      .from("asados")
      .select(ASADO_RELATIONS_SELECT)
      .gte("date", startDate)
      .lte("date", endDate);

    if (fallback.error) throw fallback.error;
    wrappedAsados = (fallback.data || []).map((asado) => ({
      ...asado,
      asado_votes: [],
    }));
  }

  if (!wrappedAsados || wrappedAsados.length === 0) {
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

  for (const asado of wrappedAsados) {
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

  // Calculate average rating using in-app votes per asado when available,
  // and fallback to legacy stored rating for asados without votes.
  let ratingSum = 0;
  let ratedAsados = 0;

  for (const asado of wrappedAsados) {
    const votes = (asado.asado_votes || []) as { score: number }[];
    if (votes.length > 0) {
      const voteAverage =
        votes.reduce((sum: number, vote: { score: number }) => sum + vote.score, 0) /
        votes.length;
      ratingSum += voteAverage;
      ratedAsados += 1;
      continue;
    }

    if (typeof asado.rating === "number") {
      ratingSum += asado.rating;
      ratedAsados += 1;
    }
  }

  const averageRating = ratedAsados > 0 ? ratingSum / ratedAsados : 0;

  // Sort rankings
  const cutRanking = Object.entries(cutStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.count - a.count);

  const guestRanking = Object.entries(guestStats)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalKg: Math.round(totalKg * 100) / 100,
    totalAsados: wrappedAsados.length,
    totalUniqueGuests: uniqueGuests.size,
    averageRating: Math.round(averageRating * 10) / 10,
    cutRanking,
    guestRanking,
  };
}

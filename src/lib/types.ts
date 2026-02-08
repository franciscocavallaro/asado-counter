// Database types
export interface Cut {
  id: string;
  name: string;
  created_at: string;
}

export interface Guest {
  id: string;
  name: string;
  created_at: string;
}

export interface Asado {
  id: string;
  date: string;
  title: string | null;
  rating: number;
  created_at: string;
}

export interface AsadoCut {
  id: string;
  asado_id: string;
  cut_id: string;
  weight_kg: number;
  created_at: string;
  cut?: Cut;
}

export interface AsadoGuest {
  id: string;
  asado_id: string;
  guest_id: string;
  created_at: string;
  guest?: Guest;
}

// Extended Asado with relations
export interface AsadoWithRelations extends Asado {
  asado_cuts: (AsadoCut & { cut: Cut })[];
  asado_guests: (AsadoGuest & { guest: Guest })[];
}

// Form types
export interface CutInput {
  id?: string;
  name: string;
  weight_kg: number;
}

export interface GuestInput {
  id?: string;
  name: string;
}

export interface AsadoFormData {
  date: string; // ISO string format
  title?: string;
  rating: number;
  cuts: CutInput[];
  guests: GuestInput[];
}

// Statistics types
export interface WrappedStats {
  totalKg: number;
  totalAsados: number;
  totalUniqueGuests: number;
  averageRating: number;
  cutRanking: { name: string; count: number; totalKg: number }[];
  guestRanking: { name: string; count: number }[];
}


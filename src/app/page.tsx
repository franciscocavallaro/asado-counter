"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Flame, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AsadoForm } from "@/components/asado-form";
import { AsadoList } from "@/components/asado-list";
import { getAsados, getCuts, getGuests } from "@/lib/actions";
import type { AsadoWithRelations, Cut, Guest } from "@/lib/types";

export default function Home() {
  const [asados, setAsados] = useState<AsadoWithRelations[]>([]);
  const [cuts, setCuts] = useState<Cut[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [asadosData, cutsData, guestsData] = await Promise.all([
        getAsados(),
        getCuts(),
        getGuests(),
      ]);
      setAsados(asadosData);
      setCuts(cutsData);
      setGuests(guestsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    loadData();
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-red-500/5 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent" />
        
        <div className="container max-w-5xl mx-auto px-4 py-8 sm:py-12 relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/20">
                <Flame className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Contador de Asados
                </h1>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Registrá todos tus asados
                </p>
              </div>
            </div>

            <div className="flex justify-center sm:justify-end">
              <Link href="/wrapped">
                <Button variant="outline" className="gap-2" size="sm">
                  <BarChart3 className="h-4 w-4" />
                  Resumen
                </Button>
              </Link>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <AsadoForm cuts={cuts} guests={guests} onSuccess={handleRefresh} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-5xl mx-auto px-4 pb-12 sm:pb-16">
        {loading ? (
          <div className="text-center py-12 sm:py-16">
            <p className="text-muted-foreground">Cargando asados...</p>
          </div>
        ) : (
          <AsadoList asados={asados} onRefresh={handleRefresh} />
        )}
      </div>
    </main>
  );
}

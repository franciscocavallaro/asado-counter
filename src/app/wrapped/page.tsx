"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WrappedStatsDisplay } from "@/components/wrapped-stats";
import { getWrappedStats } from "@/lib/actions";
import type { WrappedStats } from "@/lib/types";

export default function WrappedPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState<WrappedStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const data = await getWrappedStats(year);
        setStats(data);
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [year]);

  const currentYear = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <Link href="/">
            <Button variant="ghost" className="gap-2 px-2 sm:px-4" size="sm">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
          </Link>

          {/* Year Selector */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setYear(year - 1)}
              className="h-8 w-8 sm:h-10 sm:w-10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-mono font-bold text-base sm:text-lg w-14 sm:w-16 text-center">
              {year}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setYear(year + 1)}
              disabled={year >= currentYear}
              className="h-8 w-8 sm:h-10 sm:w-10"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12 sm:py-16">
            <p className="text-muted-foreground">Cargando estadísticas...</p>
          </div>
        ) : stats ? (
          <WrappedStatsDisplay stats={stats} year={year} />
        ) : (
          <div className="text-center py-12 sm:py-16">
            <p className="text-muted-foreground">Error al cargar las estadísticas</p>
          </div>
        )}
      </div>
    </main>
  );
}


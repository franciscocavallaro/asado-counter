"use client";

import { AsadoCard } from "./asado-card";
import type { AsadoWithRelations } from "@/lib/types";

interface AsadoListProps {
  asados: AsadoWithRelations[];
  onRefresh: () => void;
}

export function AsadoList({ asados, onRefresh }: AsadoListProps) {
  if (asados.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16">
        <p className="text-muted-foreground text-base sm:text-lg">Todavía no hay asados</p>
        <p className="text-muted-foreground/70 text-sm mt-1">
          Tocá el botón de arriba para registrar tu primer asado
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {asados.map((asado) => (
        <AsadoCard key={asado.id} asado={asado} onDelete={onRefresh} />
      ))}
    </div>
  );
}


"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2, Users, Beef, Star, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AsadoForm } from "@/components/asado-form";
import type { AsadoWithRelations, Cut, Guest } from "@/lib/types";
import { deleteAsado } from "@/lib/actions";

interface AsadoCardProps {
  asado: AsadoWithRelations;
  cuts: Cut[];
  guests: Guest[];
  onDelete: () => void;
  onUpdate: () => void;
}

export function AsadoCard({ asado, cuts, guests, onDelete, onUpdate }: AsadoCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const totalWeight = asado.asado_cuts.reduce(
    (sum, ac) => sum + Number(ac.weight_kg),
    0
  );

  const handleCardClick = () => {
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAsado(asado.id);
      setDeleteDialogOpen(false);
      onDelete();
    } catch (error) {
      console.error("Error deleting asado:", error);
      alert("Error al eliminar el asado");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card 
        className="group relative overflow-hidden transition-all hover:shadow-lg active:scale-[0.98] border-border/50 bg-card/80 backdrop-blur-sm cursor-pointer"
        onClick={handleCardClick}
      >
      <CardHeader className="px-4 sm:px-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            {asado.title ? (
              <>
                <h3 className="text-base sm:text-lg font-semibold truncate">
                  {asado.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-mono">
                  {format(new Date(asado.date + 'T12:00:00'), "d 'de' MMM, yyyy", { locale: es })}
                </p>
              </>
            ) : (
              <p className="text-base sm:text-lg font-semibold font-mono mb-2">
                {format(new Date(asado.date + 'T12:00:00'), "d 'de' MMM, yyyy", { locale: es })}
              </p>
            )}
            <div className="flex items-center gap-1 bg-amber-500/20 text-amber-500 px-2 py-1 rounded-md w-fit">
              <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
              <span className="font-mono font-bold text-sm sm:text-base">{asado.rating}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDeleteClick}
            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive h-8 w-8 z-10 shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
        {/* Cuts */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Beef className="h-4 w-4" />
            <span>
              Cortes ({totalWeight.toFixed(1)} kg total)
            </span>
          </div>
          <div className="flex flex-wrap gap-1 sm:gap-1.5">
            {asado.asado_cuts.map((ac) => (
              <Badge
                key={ac.id}
                variant="secondary"
                className="font-normal text-xs sm:text-sm"
              >
                {ac.cut.name}{" "}
                <span className="ml-1 font-mono text-xs opacity-70">
                  {Number(ac.weight_kg).toFixed(1)}kg
                </span>
              </Badge>
            ))}
          </div>
        </div>

        {/* Guests */}
        {asado.asado_guests.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                Invitados ({asado.asado_guests.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-1.5">
              {asado.asado_guests.map((ag) => (
                <Badge
                  key={ag.id}
                  variant="outline"
                  className="font-normal text-xs sm:text-sm"
                >
                  {ag.guest.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Eliminar Asado
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base pt-2">
              ¿Estás seguro que querés eliminar este asado? Esta acción no se puede deshacer.
              {asado.title && (
                <span className="block mt-2 font-medium">
                  "{asado.title}"
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <AsadoForm
        cuts={cuts}
        guests={guests}
        asado={asado}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          setEditDialogOpen(false);
          onUpdate();
        }}
      />
    </>
  );
}


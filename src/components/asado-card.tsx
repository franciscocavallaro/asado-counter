"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2, Users, Beef, Star, AlertTriangle, MapPin, Share2 } from "lucide-react";
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
import { truncateTo1Decimal } from "@/lib/utils";

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
  const [isSharing, setIsSharing] = React.useState(false);

  const asadoCuts = Array.isArray(asado.asado_cuts) ? asado.asado_cuts : [];
  const asadoGuests = Array.isArray(asado.asado_guests) ? asado.asado_guests : [];
  const asadoVotes = Array.isArray(asado.asado_votes) ? asado.asado_votes : [];
  const asadoDate = new Date(`${asado.date}T12:00:00`);
  const hasValidDate = !Number.isNaN(asadoDate.getTime());
  const displayDate = hasValidDate
    ? format(asadoDate, "d 'de' MMM, yyyy", { locale: es })
    : "Fecha inválida";

  const totalWeight = asadoCuts.reduce(
    (sum, ac) => sum + Number(ac.weight_kg),
    0
  );
  const voteAverage = asadoVotes.length > 0
    ? asadoVotes.reduce((sum, vote) => sum + vote.score, 0) / asadoVotes.length
    : null;
  const fallbackRating = typeof asado.rating === "number" ? asado.rating : null;
  const displayedRating = voteAverage ?? fallbackRating;
  const averageLabel = displayedRating !== null ? truncateTo1Decimal(displayedRating) : "Sin votos";
  const voteUrl = `/vote/${asado.id}`;

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

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl =
      typeof window !== "undefined" ? `${window.location.origin}${voteUrl}` : voteUrl;

    setIsSharing(true);
    try {
      if (navigator.share) {
        try {
          await navigator.share({ url: shareUrl });
          return;
        } catch (shareError) {
          if (shareError instanceof DOMException && shareError.name === "AbortError") {
            return;
          }
        }
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copiado");
        return;
      }

      window.prompt("Copiá este link para compartir:", shareUrl);
    } catch (error) {
      console.error("Error sharing vote link:", error);
      window.prompt("No se pudo compartir automáticamente. Copiá el link:", shareUrl);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      <Card 
        className="group relative overflow-hidden transition-all hover:shadow-lg active:scale-[0.98] border-border/50 bg-card/80 backdrop-blur-sm cursor-pointer"
        onClick={handleCardClick}
      >
      <CardHeader className="px-4 sm:px-6">
        <div className="flex w-full items-start justify-between">
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            {asado.title ? (
              <>
                <h3 className="text-base sm:text-lg font-semibold truncate">
                  {asado.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-mono">
                  {displayDate}
                </p>
              </>
            ) : (
              <p className="text-base sm:text-lg font-semibold font-mono">
                {displayDate}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="truncate">{asado.location}</span>
            </div>
            <div className="flex flex-row gap-2">
                <div className="flex items-center gap-1 bg-amber-500/20 text-amber-500 px-2 py-1 rounded-md w-fit">
                  <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
              <span className="font-mono font-bold text-sm sm:text-base">
                {averageLabel}
                {displayedRating !== null ? "/10" : ""}
              </span>
                  {asadoVotes.length > 0 && (
                    <span className="text-[11px] sm:text-xs opacity-80 ml-1">
                      {asadoVotes.length} voto{asadoVotes.length === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={handleShareClick}
                    disabled={isSharing}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    {isSharing ? "Compartiendo..." : "Compartir"}
                  </Button>
              </div>
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
        {/* Vote action */}
        {/* Cuts */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Beef className="h-4 w-4" />
            <span>
              Cortes ({truncateTo1Decimal(totalWeight)} kg total)
            </span>
          </div>
          <div className="flex flex-wrap gap-1 sm:gap-1.5">
            {asadoCuts.map((ac) => (
              <Badge
                key={ac.id}
                variant="secondary"
                className="font-normal text-xs sm:text-sm"
              >
                {ac.cut.name}{" "}
                <span className="ml-1 font-mono text-xs opacity-70">
                  {truncateTo1Decimal(Number(ac.weight_kg))}kg
                </span>
              </Badge>
            ))}
          </div>
        </div>

        {/* Guests */}
        {asadoGuests.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                Invitados ({asadoGuests.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-1.5">
              {asadoGuests.map((ag) => (
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
                  &quot;{asado.title}&quot;
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

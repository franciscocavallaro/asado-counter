"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Plus, Trash2, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CutCombobox } from "./cut-combobox";
import { GuestCombobox } from "./guest-combobox";
import type { Cut, Guest, CutInput, GuestInput, AsadoWithRelations } from "@/lib/types";
import { createAsado, updateAsado } from "@/lib/actions";

interface AsadoFormProps {
  cuts: Cut[];
  guests: Guest[];
  onSuccess: () => void;
  asado?: AsadoWithRelations | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function AsadoForm({ 
  cuts, 
  guests, 
  onSuccess, 
  asado,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger
}: AsadoFormProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange || (() => {}) : setInternalOpen;
  const isEditMode = !!asado;

  // Initialize form with asado data if editing
  React.useEffect(() => {
    if (asado && open) {
      setDate(new Date(asado.date));
      setTitle(asado.title || "");
      setRating(asado.rating);
      setCutInputs(
        asado.asado_cuts.length > 0
          ? asado.asado_cuts.map((ac) => ({
              name: ac.cut.name,
              weight_kg: Number(ac.weight_kg),
            }))
          : [{ name: "", weight_kg: 0 }]
      );
      setGuestInputs(
        asado.asado_guests.length > 0
          ? asado.asado_guests.map((ag) => ({
              name: ag.guest.name,
            }))
          : [{ name: "" }]
      );
    }
  }, [asado, open]);

  const [date, setDate] = React.useState<Date | undefined>(
    asado ? new Date(asado.date) : new Date()
  );
  const [title, setTitle] = React.useState(asado?.title || "");
  const [rating, setRating] = React.useState(asado?.rating || 7);
  const [cutInputs, setCutInputs] = React.useState<CutInput[]>(
    asado && asado.asado_cuts.length > 0
      ? asado.asado_cuts.map((ac) => ({
          name: ac.cut.name,
          weight_kg: Number(ac.weight_kg),
        }))
      : [{ name: "", weight_kg: 0 }]
  );
  const [guestInputs, setGuestInputs] = React.useState<GuestInput[]>(
    asado && asado.asado_guests.length > 0
      ? asado.asado_guests.map((ag) => ({
          name: ag.guest.name,
        }))
      : [{ name: "" }]
  );

  const resetForm = () => {
    if (!asado) {
      setDate(new Date());
      setTitle("");
      setRating(7);
      setCutInputs([{ name: "", weight_kg: 0 }]);
      setGuestInputs([{ name: "" }]);
    }
  };

  const handleAddCut = () => {
    setCutInputs([...cutInputs, { name: "", weight_kg: 0 }]);
  };

  const handleRemoveCut = (index: number) => {
    if (cutInputs.length > 1) {
      setCutInputs(cutInputs.filter((_, i) => i !== index));
    }
  };

  const handleCutChange = (
    index: number,
    field: "name" | "weight_kg",
    value: string | number
  ) => {
    const newCuts = [...cutInputs];
    if (field === "name") {
      newCuts[index].name = value as string;
    } else {
      newCuts[index].weight_kg = value as number;
    }
    setCutInputs(newCuts);
  };

  const handleAddGuest = () => {
    setGuestInputs([...guestInputs, { name: "" }]);
  };

  const handleRemoveGuest = (index: number) => {
    if (guestInputs.length > 1) {
      setGuestInputs(guestInputs.filter((_, i) => i !== index));
    }
  };

  const handleGuestChange = (index: number, value: string) => {
    const newGuests = [...guestInputs];
    newGuests[index].name = value;
    setGuestInputs(newGuests);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    const validCuts = cutInputs.filter(
      (c) => c.name.trim() !== "" && c.weight_kg > 0
    );
    const validGuests = guestInputs.filter((g) => g.name.trim() !== "");

    if (validCuts.length === 0) {
      alert("Agregá al menos un corte con peso");
      return;
    }

    setLoading(true);
    try {
      if (isEditMode && asado) {
        await updateAsado(asado.id, {
          date,
          title: title.trim() || undefined,
          rating,
          cuts: validCuts,
          guests: validGuests,
        });
      } else {
        await createAsado({
          date,
          title: title.trim() || undefined,
          rating,
          cuts: validCuts,
          guests: validGuests,
        });
      }
      resetForm();
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} asado:`, error);
      alert(`Error al ${isEditMode ? "actualizar" : "crear"} el asado`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" size="lg">
          <Flame className="h-5 w-5" />
          Nuevo Asado
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader className="pr-6 sm:pr-0">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 shrink-0" />
            <span className="break-words">Registrar Nuevo Asado</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 pt-2 sm:pt-4">
          {/* Title */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-sm sm:text-base">Título (opcional)</Label>
            <Input
              type="text"
              placeholder="Ej: Cumpleaños Juancito"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="text-sm sm:text-base"
            />
          </div>

          {/* Date and Rating Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-sm sm:text-base">Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "d 'de' MMMM, yyyy", { locale: es }) : <span>Elegir fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    locale={es}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-sm sm:text-base">Puntuación: {rating}/10</Label>
              <div className="pt-1.5 sm:pt-2">
                <Slider
                  value={[rating]}
                  onValueChange={([v]) => setRating(v)}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Cuts Section */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm sm:text-base">Cortes</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCut}
                className="gap-1 h-8 sm:h-9 text-xs sm:text-sm"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Agregar</span>
              </Button>
            </div>

            <div className="space-y-2">
              {cutInputs.map((cut, index) => (
                <div key={index} className="flex gap-1.5 sm:gap-2 items-center">
                  <div className="flex-1 min-w-0">
                    <CutCombobox
                      cuts={cuts}
                      value={cut.name}
                      onChange={(v) => handleCutChange(index, "name", v)}
                      placeholder="Elegir corte..."
                    />
                  </div>
                  <div className="w-20 sm:w-24 shrink-0">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="Kg"
                      value={cut.weight_kg || ""}
                      onChange={(e) =>
                        handleCutChange(
                          index,
                          "weight_kg",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCut(index)}
                    disabled={cutInputs.length === 1}
                    className="text-muted-foreground hover:text-destructive shrink-0 h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Guests Section */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm sm:text-base">Invitados</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddGuest}
                className="gap-1 h-8 sm:h-9 text-xs sm:text-sm"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Agregar</span>
              </Button>
            </div>

            <div className="space-y-2">
              {guestInputs.map((guest, index) => (
                <div key={index} className="flex gap-1.5 sm:gap-2 items-center">
                  <div className="flex-1 min-w-0">
                    <GuestCombobox
                      guests={guests}
                      value={guest.name}
                      onChange={(v) => handleGuestChange(index, v)}
                      placeholder="Elegir invitado..."
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveGuest(index)}
                    disabled={guestInputs.length === 1}
                    className="text-muted-foreground hover:text-destructive shrink-0 h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base" disabled={loading}>
            {loading ? "Guardando..." : "Guardar Asado"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}


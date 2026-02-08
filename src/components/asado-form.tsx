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
      setDate(new Date(asado.date + 'T12:00:00'));
      setTitle(asado.title || "");
      setRating(asado.rating);
      const cuts = asado.asado_cuts.length > 0
        ? asado.asado_cuts.map((ac) => ({
            name: ac.cut.name,
            weight_kg: Number(ac.weight_kg),
          }))
        : [{ name: "", weight_kg: 0 }];
      setCutInputs(cuts);
      // Inicializar los valores de entrada de peso con comas
      const weightInputsMap: Record<number, string> = {};
      cuts.forEach((cut, index) => {
        if (cut.weight_kg > 0) {
          weightInputsMap[index] = cut.weight_kg.toString().replace(".", ",");
        }
      });
      setWeightInputs(weightInputsMap);
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
    asado ? new Date(asado.date + 'T12:00:00') : new Date()
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
  const [weightInputs, setWeightInputs] = React.useState<Record<number, string>>({});
  
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
      setWeightInputs({});
      setGuestInputs([{ name: "" }]);
    }
  };

  const handleAddCut = () => {
    setCutInputs([...cutInputs, { name: "", weight_kg: 0 }]);
  };

  const handleRemoveCut = (index: number) => {
    if (cutInputs.length > 1) {
      setCutInputs(cutInputs.filter((_, i) => i !== index));
      setWeightInputs(prev => {
        const newState: Record<number, string> = {};
        Object.keys(prev).forEach(key => {
          const oldIndex = Number(key);
          if (oldIndex < index) {
            newState[oldIndex] = prev[oldIndex];
          } else if (oldIndex > index) {
            newState[oldIndex - 1] = prev[oldIndex];
          }
        });
        return newState;
      });
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
          date: date.toISOString(),
          title: title.trim() || undefined,
          rating,
          cuts: validCuts,
          guests: validGuests,
        });
      } else {
        await createAsado({
          date: date.toISOString(),
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
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[85dvh] sm:max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-4 flex-shrink-0 border-b">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg pr-6">
            <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 shrink-0" />
            <span className="break-words">
              {isEditMode ? "Editar Asado" : "Registrar Nuevo Asado"}
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-6 sm:space-y-8">
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
          <div className="space-y-2 sm:space-y-">
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
                      type="text"
                      inputMode="decimal"
                      placeholder="Kg"
                      value={weightInputs[index] ?? (cut.weight_kg > 0 ? cut.weight_kg.toString().replace(".", ",") : "")}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        // Permitir vacío, números positivos, y números positivos con coma o punto (sin negativos)
                        if (inputValue === "" || /^[0-9]+([,\.][0-9]*)?$/.test(inputValue) || /^[0-9]*[,\.]?$/.test(inputValue)) {
                          // Actualizar el estado local del input
                          setWeightInputs(prev => ({ ...prev, [index]: inputValue }));
                          // Convertir coma a punto para parsear y guardar en el estado numérico
                          const normalizedValue = inputValue.replace(",", ".");
                          // Si el valor termina en coma o punto, no parsear aún (usuario está escribiendo)
                          if (!inputValue.endsWith(",") && !inputValue.endsWith(".") && inputValue !== "") {
                            const parsedValue = parseFloat(normalizedValue);
                            if (!isNaN(parsedValue) && parsedValue >= 0) {
                              handleCutChange(index, "weight_kg", parsedValue);
                            }
                          } else if (inputValue === "") {
                            handleCutChange(index, "weight_kg", 0);
                          }
                        }
                      }}
                      onBlur={(e) => {
                        // Al perder el foco, asegurar que el valor esté parseado correctamente
                        const inputValue = e.target.value;
                        if (inputValue !== "") {
                          const normalizedValue = inputValue.replace(",", ".");
                          const parsedValue = parseFloat(normalizedValue);
                          // Validar que sea un número válido y no negativo
                          if (!isNaN(parsedValue) && parsedValue >= 0) {
                            handleCutChange(index, "weight_kg", parsedValue);
                            // Actualizar el input para mostrar el valor formateado
                            setWeightInputs(prev => ({ ...prev, [index]: parsedValue.toString().replace(".", ",") }));
                          } else {
                            // Si no es válido o es negativo, limpiar
                            handleCutChange(index, "weight_kg", 0);
                            setWeightInputs(prev => {
                              const newState = { ...prev };
                              delete newState[index];
                              return newState;
                            });
                          }
                        }
                      }}
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

          </div>

          {/* Submit Button - Fixed at bottom */}
          <div className="flex-shrink-0 px-3 sm:px-6 py-3 sm:py-4 border-t bg-background">
            <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base" disabled={loading}>
              {loading ? "Guardando..." : isEditMode ? "Actualizar Asado" : "Guardar Asado"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


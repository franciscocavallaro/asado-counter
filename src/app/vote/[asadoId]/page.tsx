"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Flame, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { getAsadoForVoting, submitAsadoVote } from "@/lib/actions";
import type { Asado } from "@/lib/types";

export default function VotePage() {
  const params = useParams();
  const asadoIdParam = params.asadoId;
  const asadoId = Array.isArray(asadoIdParam) ? asadoIdParam[0] : asadoIdParam;

  const [asado, setAsado] = useState<Asado | null>(null);
  const [rating, setRating] = useState(8);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!asadoId) return;

    const loadAsado = async () => {
      setLoading(true);
      try {
        const data = await getAsadoForVoting(asadoId);
        setAsado(data);
      } catch (error) {
        console.error("Error loading asado for voting:", error);
        setAsado(null);
      } finally {
        setLoading(false);
      }
    };

    loadAsado();
  }, [asadoId]);

  const formattedDate = useMemo(() => {
    if (!asado?.date) return "";
    const date = new Date(`${asado.date}T12:00:00`);
    if (Number.isNaN(date.getTime())) return asado.date;
    return format(date, "d 'de' MMMM, yyyy", { locale: es });
  }, [asado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asadoId) return;

    setSubmitting(true);
    try {
      await submitAsadoVote(asadoId, rating);
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting vote:", error);
      alert("No se pudo guardar el voto");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-background px-4 py-8">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <Flame className="h-6 w-6 text-orange-500" />
          <h1 className="text-2xl font-bold">Votar Asado</h1>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Cargando...
            </CardContent>
          </Card>
        ) : !asado ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No encontramos este asado
            </CardContent>
          </Card>
        ) : submitted ? (
          <Card>
            <CardHeader>
              <CardTitle>Gracias por votar</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Tu puntuación quedó guardada.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{asado.title || "Asado"}</CardTitle>
              <p className="text-sm text-muted-foreground">{formattedDate}</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500 fill-current" />
                    <p className="font-medium">Puntuación: {rating}/10</p>
                  </div>
                  <Slider
                    value={[rating]}
                    onValueChange={([value]) => setRating(value)}
                    min={1}
                    max={10}
                    step={1}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Guardando..." : "Enviar voto"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

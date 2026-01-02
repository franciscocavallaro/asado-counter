"use client";

import { Flame, Beef, Users, Star, Trophy, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { WrappedStats } from "@/lib/types";

interface WrappedStatsDisplayProps {
  stats: WrappedStats;
  year: number;
}

export function WrappedStatsDisplay({ stats, year }: WrappedStatsDisplayProps) {
  if (stats.totalAsados === 0) {
    return (
      <div className="text-center py-12 sm:py-16">
        <Flame className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground text-base sm:text-lg">No hay asados en {year}</p>
        <p className="text-muted-foreground/70 text-sm mt-1">
          ¡Empezá a asar para ver tu resumen del año!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="text-center space-y-1 sm:space-y-2">
        <h2 className="text-3xl sm:text-4xl font-bold font-mono tracking-tight">
          Resumen {year}
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base">Tu año en asados</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
              <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
              Total Asados
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <p className="text-3xl sm:text-4xl font-bold font-mono text-orange-500">
              {stats.totalAsados}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border-red-500/20">
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
              <Beef className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
              Carne Total
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <p className="text-3xl sm:text-4xl font-bold font-mono text-red-500">
              {stats.totalKg}
              <span className="text-sm sm:text-lg ml-1">kg</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
              Invitados
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <p className="text-3xl sm:text-4xl font-bold font-mono text-blue-500">
              {stats.totalUniqueGuests}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/20">
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
              <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
              Puntuación
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <p className="text-3xl sm:text-4xl font-bold font-mono text-amber-500">
              {stats.averageRating}
              <span className="text-sm sm:text-lg ml-1">/10</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rankings */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
        {/* Cut Ranking */}
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
              Top Cortes
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <ScrollArea className="h-[250px] sm:h-[300px] pr-3 sm:pr-4">
              <div className="space-y-2 sm:space-y-3">
                {stats.cutRanking.map((cut, index) => (
                  <div
                    key={cut.name}
                    className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/50"
                  >
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold font-mono text-xs sm:text-sm shrink-0 ${
                        index === 0
                          ? "bg-amber-500 text-amber-950"
                          : index === 1
                          ? "bg-gray-300 text-gray-700"
                          : index === 2
                          ? "bg-amber-700 text-amber-100"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">{cut.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {cut.count} {cut.count === 1 ? "vez" : "veces"} · {cut.totalKg.toFixed(1)} kg
                      </p>
                    </div>
                  </div>
                ))}
                {stats.cutRanking.length === 0 && (
                  <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm">
                    No hay cortes registrados
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Guest Ranking */}
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              Top Invitados
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <ScrollArea className="h-[250px] sm:h-[300px] pr-3 sm:pr-4">
              <div className="space-y-2 sm:space-y-3">
                {stats.guestRanking.map((guest, index) => (
                  <div
                    key={guest.name}
                    className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/50"
                  >
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold font-mono text-xs sm:text-sm shrink-0 ${
                        index === 0
                          ? "bg-amber-500 text-amber-950"
                          : index === 1
                          ? "bg-gray-300 text-gray-700"
                          : index === 2
                          ? "bg-amber-700 text-amber-100"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">{guest.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {guest.count} {guest.count === 1 ? "asado" : "asados"}
                      </p>
                    </div>
                  </div>
                ))}
                {stats.guestRanking.length === 0 && (
                  <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm">
                    No hay invitados registrados
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Flame, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const hasError = searchParams.get("error") === "1";

  const actionUrl = useMemo(
    () => `/api/login?redirect=${encodeURIComponent(redirect)}`,
    [redirect]
  );

  return (
    <main className="min-h-[100dvh] bg-background px-4 py-8 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Acceso administrador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={actionUrl} method="post" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Clave</Label>
              <div className="relative">
                <Lock className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Ingresá tu clave"
                  className="pl-9"
                />
              </div>
            </div>
            {hasError && (
              <p className="text-sm text-destructive">Clave incorrecta</p>
            )}
            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

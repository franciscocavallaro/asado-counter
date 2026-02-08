"use client";

import * as React from "react";
import { X, Camera, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  open: boolean;
}

export function BarcodeScanner({
  onScan,
  onClose,
  open,
}: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const scannerInstanceRef = React.useRef<any>(null);
  const Html5QrcodeClassRef = React.useRef<any>(null);

  const stopScanning = React.useCallback(async () => {
    if (scannerInstanceRef.current) {
      try {
        await scannerInstanceRef.current.stop();
        await scannerInstanceRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
      scannerInstanceRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const handleScanSuccess = React.useCallback((barcode: string) => {
    // Detener el escáner
    stopScanning();
    
    // Llamar al callback con el código escaneado
    onScan(barcode);
    
    // Cerrar el diálogo después de un pequeño delay
    setTimeout(() => {
      onClose();
    }, 100);
  }, [onScan, onClose, stopScanning]);

  const startScanning = React.useCallback(async (Html5Qrcode: any) => {
    try {
      setError(null);
      setIsScanning(true);

      const scanner = new Html5Qrcode("barcode-scanner-container");
      scannerInstanceRef.current = scanner;
      
      // Detectar si es móvil y específicamente Safari iOS
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isSafariIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) && 
                         /Safari/i.test(navigator.userAgent) && 
                         !/Chrome|CriOS|FxiOS/i.test(navigator.userAgent);
      
      // Configuración para móviles (especialmente Safari iOS)
      // Safari iOS es más estricto, así que usamos configuración mínima
      const config = isSafariIOS
        ? {
            // Configuración mínima para Safari iOS
            facingMode: { ideal: "environment" },
          }
        : isMobile
        ? {
            // Para otros móviles
            facingMode: "environment",
            aspectRatio: { ideal: 1.7777777778 }, // 16:9
          }
        : {
            // Para desktop
            facingMode: "environment",
          };

      // Configuración del scanner optimizada para móviles
      const scannerConfig = {
        fps: isMobile ? 5 : 10, // Menos fps en móviles para mejor rendimiento
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          // Usar un tamaño relativo en móviles
          const minEdgePercentage = isMobile ? 0.7 : 0.3;
          const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
          return {
            width: qrboxSize,
            height: qrboxSize,
          };
        },
        aspectRatio: 1.0,
        disableFlip: false, // Permitir rotación en móviles
      };
      
      await scanner.start(
        config,
        scannerConfig,
        (decodedText: string) => {
          // Código escaneado exitosamente
          handleScanSuccess(decodedText);
        },
        (errorMessage: string) => {
          // Ignorar errores de decodificación (es normal mientras busca)
        }
      );
    } catch (err: any) {
      console.error("Error starting scanner:", err);
      
      let errorMessage = "Error al iniciar el escáner.";
      
      if (err.message?.includes("Permission denied") || err.message?.includes("NotAllowedError")) {
        errorMessage = "Permiso de cámara denegado. Por favor, permití el acceso a la cámara en la configuración del navegador.";
      } else if (err.message?.includes("Camera streaming not supported") || err.message?.includes("NotReadableError")) {
        errorMessage = "La cámara no está disponible o está siendo usada por otra aplicación. Cerrala y volvé a intentar.";
      } else if (err.message?.includes("NotFoundError") || err.message?.includes("no camera")) {
        errorMessage = "No se encontró ninguna cámara disponible en este dispositivo.";
      } else {
        errorMessage = `Error: ${err.message || "No se pudo iniciar la cámara. Asegurate de estar usando HTTPS o localhost."}`;
      }
      
      setError(errorMessage);
      setIsScanning(false);
      scannerInstanceRef.current = null;
    }
  }, [handleScanSuccess]);

  React.useEffect(() => {
    if (!open) {
      stopScanning();
      return;
    }

    // Verificar que estamos en el cliente
    if (typeof window === 'undefined') {
      setError("El escáner solo está disponible en el navegador.");
      return;
    }

    // Cargar html5-qrcode dinámicamente
    const loadScanner = async () => {
      try {
        // Verificar que estamos en HTTPS o localhost (requerido para acceso a cámara)
        const isSecureContext = window.isSecureContext || 
          window.location.protocol === 'https:' || 
          window.location.hostname === 'localhost' || 
          window.location.hostname === '127.0.0.1';
        
        if (!isSecureContext) {
          setError("El acceso a la cámara requiere HTTPS. Por favor, usá una conexión segura.");
          return;
        }

        // Verificar que el navegador soporte getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError("Tu navegador no soporta el acceso a la cámara. Probá con Safari, Chrome o Firefox.");
          return;
        }

        // @ts-ignore - html5-qrcode se carga dinámicamente
        const html5QrcodeModule = await import("html5-qrcode").catch((importError) => {
          // Si falla la importación, intentar con una ruta alternativa
          console.error("Error importing html5-qrcode:", importError);
          throw importError;
        });
        
        if (!html5QrcodeModule || !html5QrcodeModule.Html5Qrcode) {
          throw new Error("html5-qrcode module is not available");
        }
        
        const Html5Qrcode = html5QrcodeModule.Html5Qrcode;
        Html5QrcodeClassRef.current = Html5Qrcode;
        startScanning(Html5Qrcode);
      } catch (err: any) {
        console.error("Error loading scanner:", err);
        
        // Detectar el tipo de error
        let errorMessage = "No se pudo cargar el escáner.";
        
        if (err?.message?.includes("Cannot find module") || err?.code === "MODULE_NOT_FOUND") {
          errorMessage = "El paquete html5-qrcode no está instalado. Ejecutá: npm install html5-qrcode";
        } else if (err?.message?.includes("Failed to fetch") || err?.message?.includes("network")) {
          errorMessage = "Error de red al cargar el escáner. Verificá tu conexión e intentá de nuevo.";
        } else {
          errorMessage = `Error al cargar el escáner: ${err?.message || "Error desconocido"}`;
        }
        
        setError(errorMessage);
      }
    };

    loadScanner();

    return () => {
      stopScanning();
    };
  }, [open, startScanning, stopScanning]);

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Escanear Código de Barras
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 sm:p-6">
          {error ? (
            <div className="space-y-4">
              <div className="text-sm text-destructive bg-destructive/10 p-4 rounded-lg">
                {error}
              </div>
              <Button onClick={handleClose} variant="outline" className="w-full">
                Cerrar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                id="barcode-scanner-container"
                className={cn(
                  "w-full rounded-lg overflow-hidden bg-black",
                  "min-h-[300px] max-h-[60vh]",
                  !isScanning && "aspect-video flex items-center justify-center"
                )}
                style={{
                  position: "relative",
                }}
              >
                {!isScanning && (
                  <div className="text-white text-center p-4 absolute inset-0 flex flex-col items-center justify-center">
                    <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Iniciando cámara...</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Apuntá la cámara al código de barras del producto
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

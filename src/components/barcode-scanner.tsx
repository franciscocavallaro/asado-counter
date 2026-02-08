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
  const [error, setError] = React.useState<string | null>(null);
  const [isScanning, setIsScanning] = React.useState(false);

  const handleScanSuccess = React.useCallback((barcode: string) => {
    // Llamar al callback con el código escaneado
    onScan(barcode);
    
    // Cerrar el diálogo después de un pequeño delay
    setTimeout(() => {
      onClose();
    }, 100);
  }, [onScan, onClose]);

  const handleError = React.useCallback((err: any) => {
    console.error("Scanner error:", err);
    
    let errorMessage = "Error al iniciar el escáner.";
    
    if (err?.message?.includes("Permission denied") || err?.message?.includes("NotAllowedError")) {
      errorMessage = "Permiso de cámara denegado. Por favor, permití el acceso a la cámara en la configuración del navegador.";
    } else if (err?.message?.includes("Camera streaming not supported") || err?.message?.includes("NotReadableError")) {
      errorMessage = "La cámara no está disponible o está siendo usada por otra aplicación. Cerrala y volvé a intentar.";
    } else if (err?.message?.includes("NotFoundError") || err?.message?.includes("no camera")) {
      errorMessage = "No se encontró ninguna cámara disponible en este dispositivo.";
    } else {
      errorMessage = `Error: ${err?.message || "No se pudo iniciar la cámara. Asegurate de estar usando HTTPS o localhost."}`;
    }
    
    setError(errorMessage);
    setIsScanning(false);
  }, []);

  React.useEffect(() => {
    if (!open) {
      setIsScanning(false);
      setError(null);
      return;
    }

    // Verificar que estamos en el cliente
    if (typeof window === 'undefined') {
      setError("El escáner solo está disponible en el navegador.");
      return;
    }

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
  }, [open]);

  const handleClose = () => {
    setIsScanning(false);
    setError(null);
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
                className={cn(
                  "w-full rounded-lg overflow-hidden bg-black",
                  "min-h-[300px] max-h-[60vh]",
                  !isScanning && "aspect-video flex items-center justify-center"
                )}
                style={{
                  position: "relative",
                }}
              >
                {open && (
                  <QrBarcodeScannerComponent
                    onScan={handleScanSuccess}
                    onError={handleError}
                    setIsScanning={setIsScanning}
                  />
                )}
                {!isScanning && (
                  <div className="text-white text-center p-4 absolute inset-0 flex flex-col items-center justify-center z-10">
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

// Componente interno que carga react-qr-barcode-scanner dinámicamente
function QrBarcodeScannerComponent({
  onScan,
  onError,
  setIsScanning,
}: {
  onScan: (barcode: string) => void;
  onError: (err: any) => void;
  setIsScanning: (scanning: boolean) => void;
}) {
  const [ScannerComponent, setScannerComponent] = React.useState<any>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let mounted = true;

    const loadComponent = async () => {
      try {
        // Cargar react-qr-barcode-scanner dinámicamente
        // @ts-ignore
        const module = await import("react-qr-barcode-scanner");
        
        // Intentar diferentes formas de exportación comunes
        const Component = module.default || 
                         module.QrBarcodeScanner || 
                         module.Scanner ||
                         module.BarcodeScanner ||
                         module.QRScanner;
        
        if (mounted) {
          if (Component) {
            setScannerComponent(() => Component);
            setIsScanning(true);
          } else {
            throw new Error("No se encontró el componente Scanner en react-qr-barcode-scanner");
          }
        }
      } catch (err: any) {
        console.error("Error loading react-qr-barcode-scanner:", err);
        if (mounted) {
          let errorMessage = "No se pudo cargar el escáner.";
          
          if (err?.message?.includes("Cannot find module") || err?.code === "MODULE_NOT_FOUND") {
            errorMessage = "El paquete react-qr-barcode-scanner no está instalado. Ejecutá: npm install react-qr-barcode-scanner";
          } else if (err?.message?.includes("Failed to fetch") || err?.message?.includes("network")) {
            errorMessage = "Error de red al cargar el escáner. Verificá tu conexión e intentá de nuevo.";
          } else {
            errorMessage = `Error al cargar el escáner: ${err?.message || "Error desconocido"}`;
          }
          
          onError(new Error(errorMessage));
        }
      }
    };

    loadComponent();

    return () => {
      mounted = false;
    };
  }, [onError, setIsScanning]);

  // Detectar si es móvil y específicamente Safari iOS
  const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isSafariIOS = typeof window !== 'undefined' && 
    /iPhone|iPad|iPod/i.test(navigator.userAgent) && 
    /Safari/i.test(navigator.userAgent) && 
    !/Chrome|CriOS|FxiOS/i.test(navigator.userAgent);

  // Configuración de la cámara
  const constraints = isSafariIOS
    ? {
        facingMode: { ideal: "environment" },
      }
    : isMobile
    ? {
        facingMode: "environment",
        aspectRatio: { ideal: 1.7777777778 }, // 16:9
      }
    : {
        facingMode: "environment",
      };

  if (!ScannerComponent) {
    return null;
  }

  // Intentar diferentes APIs comunes de librerías React para escaneo
  // Ajustar según la documentación real de react-qr-barcode-scanner
  const handleScanResult = React.useCallback((result: any) => {
    const text = result?.getText?.() || result?.text || result || (typeof result === 'string' ? result : null);
    if (text) {
      onScan(text);
    }
  }, [onScan]);

  const handleScannerError = React.useCallback((err: any) => {
    // Solo reportar errores críticos, no errores de decodificación
    if (err?.message && !err.message.includes("No QR code")) {
      onError(err);
    }
  }, [onError]);

  const scannerProps: any = {
    // Opción 1: API con onUpdate (común en algunas librerías)
    onUpdate: (err: any, result: any) => {
      if (err) {
        // Ignorar errores de decodificación (es normal mientras busca)
        return;
      }
      if (result) {
        handleScanResult(result);
      }
    },
    // Opción 2: API con onScan (más directo)
    onScan: handleScanResult,
    // Opción 3: API con onDetected
    onDetected: handleScanResult,
    // Manejo de errores
    onError: handleScannerError,
    // Configuración de cámara
    constraints: constraints,
    // Estilo
    style: {
      width: "100%",
      height: "100%",
    },
    // Configuración adicional común
    delay: isMobile ? 300 : 100,
    facingMode: "environment",
  };

  return (
    <div ref={containerRef} className="w-full h-full">
      <ScannerComponent {...scannerProps} />
    </div>
  );
}

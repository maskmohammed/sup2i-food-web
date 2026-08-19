"use client";

import { useEffect } from "react";

export interface ScannerAdapter {
  /** S'abonne aux scans. Retourne une fonction de désabonnement/cleanup. */
  onScan(callback: (code: string) => void): () => void;
}

const FAST_TYPE_THRESHOLD_MS = 50;

/**
 * "Keyboard wedge" — le mode d'intégration le plus courant pour les
 * scanners USB/Bluetooth HID : le scanner tape les caractères du
 * code-barres comme un clavier, très rapidement, puis envoie Enter.
 * On distingue un scan d'une frappe humaine par l'intervalle entre
 * caractères (~1-10ms pour un scanner, largement au-dessus pour un
 * humain) : si l'écart dépasse FAST_TYPE_THRESHOLD_MS, le buffer est
 * réinitialisé.
 *
 * Limite connue : comme un vrai scanner HID, ce listener global capte les
 * frappes même si le focus est sur un champ de saisie normal (ex. un
 * input du formulaire) — c'est le comportement réel du matériel, pas une
 * approximation du mock. À valider/ajuster avec le matériel réel de
 * l'établissement en W13.
 */
export function createKeyboardWedgeScanner(): ScannerAdapter {
  return {
    onScan(callback) {
      let buffer = "";
      let lastCharTime = 0;

      function handleKeyDown(event: KeyboardEvent) {
        const now = Date.now();
        if (now - lastCharTime > FAST_TYPE_THRESHOLD_MS) {
          buffer = "";
        }
        lastCharTime = now;

        if (event.key === "Enter") {
          if (buffer.length > 0) {
            callback(buffer);
          }
          buffer = "";
          return;
        }

        if (event.key.length === 1) {
          buffer += event.key;
        }
      }

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    },
  };
}

/** Hook de confort : s'abonne au montage, se désabonne au démontage. */
export function useKeyboardWedgeScanner(onScan: (code: string) => void): void {
  useEffect(() => {
    const adapter = createKeyboardWedgeScanner();
    return adapter.onScan(onScan);
  }, [onScan]);
}

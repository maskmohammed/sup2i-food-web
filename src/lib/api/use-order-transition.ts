"use client";

import { useState } from "react";
import { apiFetch } from "./client";
import type { ApiError } from "./types";
import type { Order, OrderStatus } from "./orders-types";

type UseOrderTransitionResult = {
  pendingTarget: OrderStatus | null;
  error: ApiError | null;
  transition: (targetStatus: OrderStatus) => Promise<void>;
};

export function useOrderTransition(orderId: string, onSuccess?: (order: Order) => void): UseOrderTransitionResult {
  const [pendingTarget, setPendingTarget] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  async function transition(targetStatus: OrderStatus) {
    if (pendingTarget) return;

    setPendingTarget(targetStatus);
    setError(null);

    const result = await apiFetch<Order>(`/api/v1/orders/${orderId}/transition`, {
      method: "POST",
      body: JSON.stringify({ targetStatus }),
    });

    setPendingTarget(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onSuccess?.(result.data);
  }

  return { pendingTarget, error, transition };
}

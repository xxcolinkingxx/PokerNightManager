"use client";

import { PAYMENT_METHODS, PAYMENT_METHOD_LABEL } from "@/lib/session/constants";
import type { PaymentMethod } from "@/lib/session/types";
import { cn } from "@/lib/utils";

interface PaymentMethodPickerProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

export function PaymentMethodPicker({ value, onChange }: PaymentMethodPickerProps) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Payment method">
      {PAYMENT_METHODS.map((method) => (
        <button
          key={method}
          type="button"
          role="radio"
          aria-checked={value === method}
          onClick={() => onChange(method)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            value === method
              ? "border-gold bg-gold/10 text-gold"
              : "border-border text-muted-foreground",
          )}
        >
          {PAYMENT_METHOD_LABEL[method]}
        </button>
      ))}
    </div>
  );
}

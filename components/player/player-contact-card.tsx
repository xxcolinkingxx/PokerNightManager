import { Phone } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Player } from "@/lib/session/types";

type PaymentFieldKey = "venmo" | "cashApp" | "appleCash" | "zelle";

const PAYMENT_FIELDS: Array<{ key: PaymentFieldKey; label: string }> = [
  { key: "venmo", label: "Venmo" },
  { key: "cashApp", label: "Cash App" },
  { key: "appleCash", label: "Apple Cash" },
  { key: "zelle", label: "Zelle" },
];

interface PlayerContactCardProps {
  player: Player;
}

export function PlayerContactCard({ player }: PlayerContactCardProps) {
  const paymentEntries = PAYMENT_FIELDS.filter(({ key }) => player[key]);
  const hasContactInfo = Boolean(player.phone) || paymentEntries.length > 0 || Boolean(player.notes);

  if (!hasContactInfo) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Contact &amp; Payments</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {player.phone && (
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" aria-hidden="true" />
              Phone
            </span>
            <span className="font-medium text-foreground">{player.phone}</span>
          </div>
        )}

        {paymentEntries.length > 0 && (
          <>
            {player.phone && <Separator />}
            {paymentEntries.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-foreground">{player[key]}</span>
              </div>
            ))}
          </>
        )}

        {player.notes && (
          <>
            {(player.phone || paymentEntries.length > 0) && <Separator />}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Notes</span>
              <p className="text-sm text-foreground">{player.notes}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

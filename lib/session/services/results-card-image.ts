import type { ResultsCardData } from "./results-card-data";
import { formatCurrency } from "./session-engine";

// Matches app/globals.css's theme tokens -- canvas can't read CSS custom
// properties, so these are duplicated here deliberately.
const COLORS = {
  background: "#090909",
  panel: "#131313",
  foreground: "#f5f5f5",
  mutedForeground: "rgba(245, 245, 245, 0.6)",
  gold: "#d4af37",
  border: "rgba(255, 255, 255, 0.08)",
  success: "#2ecc71",
  danger: "#e74c3c",
};

const WIDTH = 1080;
const MARGIN = 72;
const MAX_ROWS = 10;
const ROW_HEIGHT = 96;
const HEADER_HEIGHT = MARGIN + 260;
const FOOTER_SPACE = 160;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Renders a session's results as a shareable PNG, styled to match the
// app's own dark/gold theme -- built with plain Canvas 2D rather than a
// screenshot-a-hidden-DOM-node library, since the layout is simple and
// this avoids pulling in a dependency for it.
export async function renderResultsCardImage(data: ResultsCardData): Promise<Blob> {
  const rows = data.rows.slice(0, MAX_ROWS);
  const overflowCount = data.rows.length - rows.length;
  const panelTop = HEADER_HEIGHT;
  const panelHeight = rows.length * ROW_HEIGHT + 48 + (overflowCount > 0 ? 56 : 0);
  // Content-driven height -- a 3-player cash game shouldn't produce the
  // same amount of dead space as a 10-player tournament.
  const HEIGHT = Math.max(700, panelTop + panelHeight + FOOTER_SPACE);

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser");

  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.textBaseline = "alphabetic";

  // Header
  ctx.fillStyle = COLORS.gold;
  ctx.font = "600 32px system-ui, -apple-system, sans-serif";
  ctx.fillText("POKER NIGHT RESULTS", MARGIN, MARGIN + 32);

  ctx.fillStyle = COLORS.foreground;
  ctx.font = "700 56px system-ui, -apple-system, sans-serif";
  wrapText(ctx, data.sessionName, MARGIN, MARGIN + 108, WIDTH - MARGIN * 2, 62);

  ctx.fillStyle = COLORS.mutedForeground;
  ctx.font = "400 30px system-ui, -apple-system, sans-serif";
  ctx.fillText(`${data.dateLabel} · ${data.locationLabel}`, MARGIN, MARGIN + 210);

  // Standings panel
  ctx.fillStyle = COLORS.panel;
  roundRect(ctx, MARGIN, panelTop, WIDTH - MARGIN * 2, panelHeight, 32);
  ctx.fill();

  rows.forEach((row, index) => {
    const rowY = panelTop + 48 + index * ROW_HEIGHT;

    if (index > 0) {
      ctx.strokeStyle = COLORS.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(MARGIN + 40, rowY);
      ctx.lineTo(WIDTH - MARGIN - 40, rowY);
      ctx.stroke();
    }

    const textY = rowY + ROW_HEIGHT / 2 + 12;

    ctx.fillStyle = index === 0 && row.profit !== null && row.profit > 0 ? COLORS.gold : COLORS.foreground;
    ctx.font = "600 38px system-ui, -apple-system, sans-serif";
    ctx.fillText(`${index + 1}. ${row.playerName}`, MARGIN + 40, textY);

    const amountText = row.profit === null ? "--" : `${row.profit > 0 ? "+" : ""}${formatCurrency(row.profit)}`;
    ctx.fillStyle =
      row.profit === null
        ? COLORS.mutedForeground
        : row.profit > 0
          ? COLORS.success
          : row.profit < 0
            ? COLORS.danger
            : COLORS.mutedForeground;
    ctx.font = "700 38px system-ui, -apple-system, sans-serif";
    const amountWidth = ctx.measureText(amountText).width;
    ctx.fillText(amountText, WIDTH - MARGIN - 40 - amountWidth, textY);
  });

  if (overflowCount > 0) {
    ctx.fillStyle = COLORS.mutedForeground;
    ctx.font = "400 28px system-ui, -apple-system, sans-serif";
    ctx.fillText(
      `+ ${overflowCount} more player${overflowCount === 1 ? "" : "s"}`,
      MARGIN + 40,
      panelTop + 48 + rows.length * ROW_HEIGHT + 40,
    );
  }

  // Footer branding
  ctx.fillStyle = COLORS.mutedForeground;
  ctx.font = "500 28px system-ui, -apple-system, sans-serif";
  ctx.fillText("Tracked with Poker Night Manager", MARGIN, HEIGHT - MARGIN);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Couldn't generate the results image"));
    }, "image/png");
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}

// Shares the image via the native share sheet when available (the
// expected path on the phone this is actually used from), falling back
// to a plain download for browsers without Web Share's file support.
export async function shareOrDownloadImage(blob: Blob, filename: string, shareTitle: string): Promise<void> {
  const file = new File([blob], filename, { type: "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: shareTitle });
      return;
    } catch (error) {
      // AbortError means the user just closed the share sheet -- not a
      // failure worth falling back for.
      if (error instanceof Error && error.name === "AbortError") return;
    }
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

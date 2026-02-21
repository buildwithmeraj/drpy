"use client";

import { useEffect, useRef } from "react";

export default function BrandedQrCode({ value, size = 120 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let active = true;

    const renderQr = async () => {
      const canvas = canvasRef.current;
      if (!canvas || !value) return;

      const [{ default: QRCode }] = await Promise.all([import("qrcode")]);

      await QRCode.toCanvas(canvas, value, {
        width: size,
        margin: 1,
        errorCorrectionLevel: "H",
        color: {
          dark: "#111827",
          light: "#ffffff",
        },
      });

      if (!active) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const logoSize = Math.round(size * 0.22);
      const bgSize = logoSize + 10;
      const x = Math.round((size - bgSize) / 2);
      const y = Math.round((size - bgSize) / 2);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x, y, bgSize, bgSize);

      const logo = new Image();
      logo.onload = () => {
        if (!active) return;
        const lx = Math.round((size - logoSize) / 2);
        const ly = Math.round((size - logoSize) / 2);
        ctx.drawImage(logo, lx, ly, logoSize, logoSize);
      };
      logo.src = "/icon.svg";
    };

    renderQr();

    return () => {
      active = false;
    };
  }, [value, size]);

  return <canvas ref={canvasRef} width={size} height={size} className="rounded-lg border border-base-300" />;
}

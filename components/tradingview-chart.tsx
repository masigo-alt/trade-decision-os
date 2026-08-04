"use client";

import { useEffect, useRef } from "react";

export function TradingViewChart({ tvSymbol, height = 720 }: { tvSymbol: string; height?: number }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = container.current;
    if (!el) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.textContent = JSON.stringify({
      symbol: tvSymbol,
      theme: "dark",
      autosize: true,
      interval: "D",
      style: "1",
      hide_side_toolbar: true,
      allow_symbol_change: false,
    });
    el.appendChild(script);

    return () => {
      const widget = el.querySelector(".tradingview-widget-container__widget");
      if (widget) widget.innerHTML = "";
      script.remove();
    };
  }, [tvSymbol]);

  return <div className="surface overflow-hidden p-3" style={{ height }}>
    <div ref={container} className="tradingview-widget-container" style={{ height: "100%" }}>
      <div className="tradingview-widget-container__widget" style={{ height: "calc(100% - 32px)" }} />
      <div className="tradingview-widget-copyright"><a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span className="text-xs text-[#2962ff]">Track all markets on TradingView</span></a></div>
    </div>
  </div>;
}

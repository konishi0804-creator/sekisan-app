"use client";

import { useEffect, useRef } from "react";
import { IS_ADSENSE_ACTIVE } from "../utils/constants";

type AdUnitProps = {
    slot: string;
    format?: "auto" | "fluid" | "rectangle";
    responsive?: boolean;
    style?: React.CSSProperties;
    className?: string;
    client?: string;
    label?: boolean;
};

export default function AdUnit({
    slot,
    format = "auto",
    responsive = true,
    style,
    className,
    client = "ca-pub-XXXXXXXXXXXXXXXX", // Placeholder - User should replace or use Env var
    label = true,
}: AdUnitProps) {
    const adRef = useRef<HTMLModElement>(null);

    useEffect(() => {
        try {
            // @ts-ignore
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        } catch (err: any) {
            // Suppress the "already have ads" error which is common in SPA transitions
            if (err?.message?.includes("already have ads")) return;
            console.error("AdSense error", err);
        }
    }, []);

    // Development visual placeholder
    if (process.env.NODE_ENV !== "production") {
        return (
            <div
                className={`bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 text-sm font-bold p-4 m-4 rounded-lg ${className}`}
                style={{ ...style, minHeight: "120px" }}
            >
                <div className="flex flex-col items-center">
                    <span className="text-xs font-normal text-slate-500 mb-1">[Dev Mode]</span>
                    <span>AdSense Placeholder</span>
                    <span className="text-xs font-normal mt-1">Slot: {slot}</span>
                    {!IS_ADSENSE_ACTIVE && <span className="text-[10px] text-red-500 mt-2 font-mono">(Disabled in Prod)</span>}
                </div>
            </div>
        );
    }

    // If AdSense is not active in Production, do not render anything
    if (!IS_ADSENSE_ACTIVE) {
        return null;
    }

    return (
        <div className={`my-4 ${className}`} style={{ overflow: "hidden" }}>
            {label && (
                <div className="text-[10px] text-slate-400 text-right mb-1">
                    スポンサーリンク
                </div>
            )}
            <ins
                className="adsbygoogle"
                style={{ display: "block", ...style }}
                data-ad-client={client}
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive={responsive ? "true" : "false"}
            />
        </div>
    );
}

"use client";

import React, { useEffect, useState, ReactNode } from "react";

interface ResolutionWrapperProps {
    children: ReactNode;
    baseWidth?: number;
    baseHeight?: number;
    maxScale?: number;
    className?: string;
}

/**
 * ResolutionWrapper ensures that the overlay is designed for a specific base resolution
 * (defaulting to 1080p) and scales to fit browser windows/OBS sources
 * while preserving item positions and shrinking naturally when zoomed out.
 */
export default function ResolutionWrapper({
    children,
    baseWidth = 1920,
    baseHeight = 1080,
    maxScale = 1,
    className = ""
}: ResolutionWrapperProps) {
    const [scale, setScale] = useState(1);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const handleResize = () => {
            const scaleX = window.innerWidth / baseWidth;
            const scaleY = window.innerHeight / baseHeight;
            const fitScale = Math.min(scaleX, scaleY);
            // Cap scale at maxScale (1) so zooming out shrinks the screen like higher resolution
            const newScale = Math.min(maxScale, fitScale);
            setScale(newScale);
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [baseWidth, baseHeight, maxScale]);

    if (!isMounted) return null;

    return (
        <div
            className={`overflow-hidden pointer-events-none ${className}`}
            style={{
                width: baseWidth,
                height: baseHeight,
                position: "fixed",
                top: 0,
                left: 0,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                backgroundColor: "transparent",
            }}
        >
            {children}
        </div>
    );
}

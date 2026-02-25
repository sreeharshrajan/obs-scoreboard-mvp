"use client";

import React, { useEffect, useState, ReactNode } from "react";

interface ResolutionWrapperProps {
    children: ReactNode;
    baseWidth?: number;
    baseHeight?: number;
    className?: string;
}

/**
 * ResolutionWrapper ensures that the overlay is designed for a specific base resolution
 * (defaulting to 1080p) and scales perfectly to fit any browser window/OBS source size
 * while maintaining the correct internal coordinate system.
 */
export default function ResolutionWrapper({
    children,
    baseWidth = 1920,
    baseHeight = 1080,
    className = ""
}: ResolutionWrapperProps) {
    const [scale, setScale] = useState(1);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const handleResize = () => {
            const scaleX = window.innerWidth / baseWidth;
            const scaleY = window.innerHeight / baseHeight;
            // Use the smaller scale to ensure everything fits, or just use X if filling a standard 16:9
            const newScale = Math.min(scaleX, scaleY);
            setScale(newScale);
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [baseWidth, baseHeight]);

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

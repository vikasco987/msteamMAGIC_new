// components/HighlightColorDropdown.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

const PRESET_COLORS = [
  "#ffffff", "#fef3c7", "#dcfce7", "#e0f2fe", "#fce7f3", "#fee2e2", "#ede9fe"
];

type Props = {
  taskId: string;
  value?: string;
  onChange: (color: string) => void;
};

export default function HighlightColorDropdown({ taskId, value, onChange }: Props) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [customColor, setCustomColor] = useState(value || "#ffffff");
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleColorClick = async (color: string) => {
    setShowDropdown(false);
    setCustomColor(color);
    onChange(color);
    try {
      await fetch("/api/tasks/highlight", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, highlightColor: color }),
      });
    } catch (err) {
      console.error("Failed to update color:", err);
    }
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    handleColorClick(newColor);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node) &&
      !triggerRef.current?.contains(event.target as Node)
    ) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    if (showDropdown && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + window.scrollY + 8, left: rect.left + window.scrollX });
    }
  }, [showDropdown]);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        className="w-6 h-6 rounded-full border cursor-pointer"
        style={{ backgroundColor: value || "#ffffff" }}
        title="Set highlight color"
        onClick={() => setShowDropdown((prev) => !prev)}
      />
      {showDropdown &&
        createPortal(
          <div
            ref={dropdownRef}
            className="z-[9999] p-3 bg-white border rounded-xl shadow-xl flex flex-col gap-2 animate-fadeIn scale-95 w-48 max-w-[95vw]"
            style={{
              position: "absolute",
              top: position.top,
              left: position.left,
              transition: "all 0.2s ease",
            }}
          >
            <div className="text-sm font-medium mb-1">🎨 Choose a color</div>
            <div className="flex flex-wrap gap-1">
              {PRESET_COLORS.map((color) => (
                <div
                  key={color}
                  className="w-6 h-6 rounded-full cursor-pointer border hover:scale-110 transition"
                  style={{ backgroundColor: color }}
                  title={color}
                  onClick={() => handleColorClick(color)}
                />
              ))}
            </div>

            <div className="mt-3">
              <label className="text-xs text-gray-600">Custom color:</label>
              <input
                type="color"
                value={customColor}
                onChange={handleCustomColorChange}
                className="w-full h-8 p-0 border mt-1 rounded cursor-pointer"
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

// components/ui/HighlightColorPicker.tsx
"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Paintbrush } from "lucide-react";
import React from "react";

type Props = {
  taskId: string;
  value: string | undefined;
  onChange: (color: string) => void;
};

const presetColors = [
  "#ffffff", // White (no highlight)
  "#f87171", // Red
  "#facc15", // Yellow
  "#4ade80", // Green
  "#60a5fa", // Blue
  "#a78bfa", // Purple
  "#f472b6", // Pink
];

export default function HighlightColorPicker({ taskId, value, onChange }: Props) {
  const handleColorChange = (color: string) => {
    onChange(color);
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="w-6 h-6 rounded-full border shadow-sm"
          style={{ backgroundColor: value || "#ffffff" }}
          title="Click to change highlight color"
        ></button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="bg-white border rounded-md p-2 shadow-md space-y-2 z-[9999]"
          side="bottom"
          align="start"
        >
          <div className="grid grid-cols-4 gap-2">
            {presetColors.map((color) => (
              <DropdownMenu.Item key={color} asChild onSelect={() => handleColorChange(color)}>
                <button
                  className="w-6 h-6 rounded-full border outline-none hover:ring-2 hover:ring-indigo-500 hover:ring-offset-1"
                  style={{ backgroundColor: color }}
                />
              </DropdownMenu.Item>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500">Custom:</span>
            <DropdownMenu.Item asChild onSelect={(e) => e.preventDefault()}>
              <input
                type="color"
                value={value || "#ffffff"}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-6 h-6 border rounded cursor-pointer outline-none hover:ring-2 hover:ring-indigo-500"
              />
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

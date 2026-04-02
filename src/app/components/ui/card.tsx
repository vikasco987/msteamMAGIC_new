import React from "react";

interface CardProps {
  title: string;
  value: string | number;
}

export function Card({ title, value }: CardProps) {
  return (
    <div className="rounded-xl bg-white shadow-md p-4 border border-gray-200">
      <h4 className="text-sm text-gray-500">{title}</h4>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

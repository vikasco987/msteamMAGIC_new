"use client";

import { FC, ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card: FC<CardProps> = ({ children, className }) => (
  <div className={`border rounded-lg shadow-sm ${className}`}>{children}</div>
);

export const CardContent: FC<CardProps> = ({ children, className }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

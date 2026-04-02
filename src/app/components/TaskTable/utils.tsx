import React from "react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

export const getSortIcon = (
  key: string,
  current: string,
  direction: "asc" | "desc"
) => {
  if (key !== current) return null;

  return direction === "asc" ? (
    <FaArrowUp className="ml-1 text-xs" />
  ) : (
    <FaArrowDown className="ml-1 text-xs" />
  );
};

export const formatCurrency = (amount: number | string | undefined): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return isNaN(Number(num)) ? "—" : `₹${Number(num).toLocaleString("en-IN")}`;
};

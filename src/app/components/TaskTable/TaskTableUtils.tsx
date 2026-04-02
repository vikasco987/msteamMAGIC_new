import { FaArrowUp, FaArrowDown } from "react-icons/fa";

export const formatCurrency = (amount: number | string) => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `₹${num.toLocaleString("en-IN")}`;
};

export const getSortIcon = (direction: "asc" | "desc") => {
  return direction === "asc" ? <FaArrowUp /> : <FaArrowDown />;
};

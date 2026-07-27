export const clientFields = [
  { key: "name", label: "Client Name", placeholder: "Enter client name" },
  { key: "address", label: "Address", placeholder: "Enter address" },
  {
    key: "representative",
    label: "Representative",
    placeholder: "Representative name",
  },
];

export const durationOptions = [
  { value: "1", label: "1 Month" },
  { value: "2", label: "2 Months" },
  { value: "3", label: "3 Months" },
  { value: "4", label: "4 Months" },
  { value: "5", label: "5 Months" },
  { value: "6", label: "6 Months" },
];

export const serviceOptions = [
  { value: "zomato", label: "Zomato" },
  { value: "swiggy", label: "Swiggy" },
  { value: "both", label: "Both" },
];

export const paymentTerms = [
  { value: "advance", label: "Advance Payment" },
  { value: "partial", label: "Partial Payment" },
];

export const getDurationLabel = (duration) => {
  const option = durationOptions.find((opt) => opt.value === duration);
  return option ? option.label : "";
};

export const getAmount = (amount) => {
  if (amount == null || isNaN(amount)) return "";
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
  return formatted;
};

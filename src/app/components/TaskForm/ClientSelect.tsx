'use client';

import React from "react";
import Select from "react-select";

type Option = { value: string; label: string };

interface Props {
  value: string;
  options: Option[];
  onChange: (val: string) => void;
}

export default function ClientSelect({ value, options, onChange }: Props) {
  return (
    <Select
      value={options.find((opt) => opt.value === value) || null}
      onChange={(selected) => selected && onChange(selected.value)}
      options={options}
      placeholder="👤 Assign to..."
      isClearable
      className="text-black"
      styles={{
        control: (base) => ({
          ...base,
          padding: "6px",
          borderRadius: "8px",
          borderColor: "#D8B4FE",
          backgroundColor: "#F5F3FF",
        }),
      }}
    />
  );
}



















// // ClientSelect.tsx
// 'use client';

// import React from "react";
// import Select from "react-select";

// type Option = { value: string; label: string };

// interface Props {
//   value: string[]; // multiple selected IDs
//   options: Option[];
//   onChange: (val: string[]) => void;
// }

// export default function ClientSelect({ value, options, onChange }: Props) {
//   const selectedOptions = options.filter((opt) => value.includes(opt.value));

//   return (
//     <Select
//       isMulti
//       options={options}
//       value={selectedOptions}
//       onChange={(selected) => onChange(selected.map((s) => s.value))}
//       placeholder="👥 Assign to team members..."
//       className="text-black"
//       styles={{
//         control: (base) => ({
//           ...base,
//           padding: "6px",
//           borderRadius: "8px",
//           borderColor: "#D8B4FE", // purple-300
//           backgroundColor: "#F5F3FF", // purple-50
//         }),
//       }}
//     />
//   );
// }

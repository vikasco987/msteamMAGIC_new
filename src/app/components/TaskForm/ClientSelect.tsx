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
      menuPortalTarget={typeof document !== "undefined" ? document.body : null}
      styles={{
        control: (base) => ({
          ...base,
          padding: "6px",
          borderRadius: "12px",
          borderColor: "#D8B4FE",
          backgroundColor: "#F5F3FF",
          boxShadow: 'none',
          '&:hover': {
            borderColor: '#A855F7',
          }
        }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        menu: (base) => ({
          ...base,
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #F3E8FF',
          padding: '4px'
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isSelected ? '#F3E8FF' : state.isFocused ? '#FAF5FF' : 'transparent',
          color: state.isSelected ? '#7E22CE' : '#1F2937',
          borderRadius: '8px',
          margin: '2px 0',
          cursor: 'pointer',
          '&:active': {
            backgroundColor: '#F3E8FF'
          }
        })
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

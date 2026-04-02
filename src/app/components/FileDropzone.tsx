




// components/FileDropzone.tsx
'use client';

import { useDropzone } from 'react-dropzone';

export function FileDropzone({ onDrop }: { onDrop: (files: File[]) => void }) {
  const { getRootProps, getInputProps, acceptedFiles } = useDropzone({
    onDrop: acceptedFiles => onDrop(acceptedFiles),
  });

  return (
    <div
      {...getRootProps()}
      className="border-2 border-dashed border-purple-300 p-4 rounded cursor-pointer bg-purple-50 hover:bg-purple-100"
    >
      <input {...getInputProps()} />
      <p className="text-center">📂 Drag & drop files here or click to upload</p>
      <ul className="mt-2 text-sm">
        {acceptedFiles.map(file => (
          <li key={file.name}>{file.name}</li>
        ))}
      </ul>
    </div>
  );
}

// components/TaskForm.tsx
// Add state:
// const [step, setStep] = useState(0);
// Replace step UI:
// {step === 0 && Basic Info Form}
// {step === 1 && Upload Fields}
// {step === 2 && Custom Fields with FileDropzone}
// Navigation:
// {step > 0 && <button onClick={() => setStep(step - 1)}>⬅ Back</button>}
// {step < 2 ? <button onClick={() => setStep(step + 1)}>➡ Next</button> : <button type="submit">Submit</button>}

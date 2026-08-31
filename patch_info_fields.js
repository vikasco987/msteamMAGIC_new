const fs = require('fs');
const path = './src/app/components/TaskDetailsPanel.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Update InfoField component definition
code = code.replace(/const InfoField = \(\{[^\}]+\}: \{[^\}]+\}\) => \{[\s\S]*?return \([\s\S]*?\n\};\n/m, `const InfoField = ({ 
  label, value, icon, copyable = false, isLink = false,
  editable = false, onChange, type = 'text', options = [],
  isMaster = false, onInlineEditSave
}: { 
  label: string, value: any, icon?: React.ReactNode, copyable?: boolean, isLink?: boolean,
  editable?: boolean, onChange?: (val: any) => void, type?: string, options?: string[],
  isMaster?: boolean, onInlineEditSave?: (val: any) => Promise<void>
}) => {
  const [inlineMode, setInlineMode] = React.useState(false);
  const [inlineValue, setInlineValue] = React.useState(value);
  const [isSaving, setIsSaving] = React.useState(false);
  
  React.useEffect(() => {
    if (!inlineMode) setInlineValue(value);
  }, [value, inlineMode]);

  if (!editable && !inlineMode && (value === undefined || value === null || value === "")) {
    if (!isMaster) return null;
  }
  
  const displayValue = String(value || "");

  const handleCopy = () => {
    navigator.clipboard.writeText(displayValue);
    // You might need a global toast here if toast isn't in scope, but it should be
  };

  const handleSave = async () => {
    if (onInlineEditSave) {
      setIsSaving(true);
      await onInlineEditSave(type === 'number' ? Number(inlineValue) : inlineValue);
      setIsSaving(false);
      setInlineMode(false);
    }
  };

  const handleDelete = async () => {
    if (onInlineEditSave) {
      if (!confirm("Are you sure you want to remove this value?")) return;
      setIsSaving(true);
      await onInlineEditSave(type === 'number' ? null : "");
      setIsSaving(false);
      setInlineMode(false);
    }
  };

  const isActuallyEditable = editable || inlineMode;
  const currentVal = editable ? displayValue : String(inlineValue || "");
  const handleChange = (e: any) => {
    if (editable && onChange) onChange(type === 'number' ? Number(e.target.value) : e.target.value);
    else setInlineValue(e.target.value);
  };

  return (
    <div className="bg-gray-50 p-4 rounded-xl flex items-start justify-between group hover:bg-gray-100 transition-colors border border-gray-100">
      <div className="flex-1 overflow-hidden pr-2">
        <div className="text-xs text-gray-500 mb-1 flex items-center justify-between font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1">{icon} {label}</span>
          {!editable && isMaster && onInlineEditSave && !inlineMode && (
             <button onClick={() => setInlineMode(true)} className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-700 transition-opacity p-1 bg-blue-50 rounded">
               <FaEdit size={10} /> Edit
             </button>
          )}
        </div>
        {isActuallyEditable ? (
          <div className="flex flex-col gap-2 mt-1">
            {type === 'select' ? (
              <select 
                value={currentVal} 
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 rounded p-1.5 text-sm text-gray-800"
              >
                <option value="">Select...</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : type === 'textarea' ? (
              <textarea
                value={currentVal}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 rounded p-1.5 text-sm text-gray-800"
                rows={3}
              />
            ) : (
              <input 
                type={type} 
                value={currentVal} 
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 rounded p-1.5 text-sm text-gray-800"
              />
            )}
            {inlineMode && !editable && (
              <div className="flex items-center justify-end gap-2 mt-1">
                <button disabled={isSaving} onClick={handleDelete} className="p-1.5 text-red-500 hover:bg-red-50 rounded bg-white border border-red-100" title="Clear/Delete">
                  <FaTrash size={12} />
                </button>
                <button disabled={isSaving} onClick={() => setInlineMode(false)} className="px-3 py-1 text-xs text-gray-600 bg-gray-200 hover:bg-gray-300 rounded font-bold">
                  Cancel
                </button>
                <button disabled={isSaving} onClick={handleSave} className="px-3 py-1 text-xs text-white bg-green-500 hover:bg-green-600 rounded flex items-center gap-1 font-bold">
                  {isSaving ? <FaSpinner className="animate-spin" size={10} /> : <FaSave size={10} />} Save
                </button>
              </div>
            )}
          </div>
        ) : isLink ? (
          <a href={displayValue} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline break-all text-sm">
            {displayValue || <span className="text-gray-400 italic">Not provided</span>}
          </a>
        ) : (
          <div className="font-semibold text-gray-800 break-words whitespace-pre-wrap text-sm">
             {displayValue || <span className="text-gray-400 italic text-xs">Not provided</span>}
          </div>
        )}
      </div>
      {copyable && !isActuallyEditable && (
        <button 
          onClick={() => {
            navigator.clipboard.writeText(displayValue);
            // toast.success("Copied!"); 
          }}
          className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all flex-shrink-0 ml-2"
          title="Copy"
        >
          <FaCopy />
        </button>
      )}
    </div>
  );
};
`);

// 2. Add handleInlineSave in TaskDetailsPanel
if (!code.includes('handleInlineSave')) {
  code = code.replace(/const handleEditChange = /, `  const handleInlineSave = async (field: string, value: any, isCustom = false) => {
    try {
      const payload = isCustom ? { customFields: { [field]: value } } : { [field]: value };
      const res = await fetch(\`/api/tasks/\${taskId}\`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to save changes");
      const updated = await res.json();
      setTask(updated.task);
      toast.success("Field updated successfully!");
    } catch(err) {
      toast.error("Error saving field");
    }
  };

  const handleEditChange = `);
}

// 3. Update Custom Data InfoField to pass isMaster and onInlineEditSave
code = code.replace(/<InfoField\s+label=\{label\}\s+value=\{displayValue\}\s+copyable\s+isLink=\{isLink\}\s*\/>/g, 
  `<InfoField 
                              label={label} 
                              value={displayValue} 
                              copyable 
                              isLink={isLink}
                              isMaster={isMaster}
                              onInlineEditSave={async (val) => await handleInlineSave(key, val, true)}
                            />`
);

// We should also patch other InfoField calls where possible. 
// A regex to add isMaster and onInlineEditSave to InfoFields where onChange is present (meaning they were part of edit mode before).
code = code.replace(/onChange=\{\(val\) => handleEditChange\('([^']+)', val, (true|false)\)\}/g, 
  `onChange={(val) => handleEditChange('$1', val, $2)} isMaster={isMaster} onInlineEditSave={async (val) => await handleInlineSave('$1', val, $2)}`
);

fs.writeFileSync(path, code);
console.log("Done");

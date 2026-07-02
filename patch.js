const fs = require('fs');

const routePath = 'src/app/api/tasks/update/route.ts';
let routeCode = fs.readFileSync(routePath, 'utf8');

// Add afe to allowed fields
routeCode = routeCode.replace(
  /!\["amount", "received", "assigneeIds", "assignerName", "assignerEmail", "assigneeId", "assigneeName", "assigneeEmail", "shopName", "phone", "email"\]\.includes\(f\)/g,
  '!["amount", "received", "assigneeIds", "assignerName", "assignerEmail", "assigneeId", "assigneeName", "assigneeEmail", "shopName", "phone", "email", "afe"].includes(f)'
);

// Add afe to syncableFields
routeCode = routeCode.replace(
  /"packageAmount", "startDate", "endDate", "timeline"/g,
  '"packageAmount", "startDate", "endDate", "timeline", "afe"'
);

fs.writeFileSync(routePath, routeCode);

const bodyPath = 'src/app/components/TaskTable/TaskTableBody.tsx';
let bodyCode = fs.readFileSync(bodyPath, 'utf8');

bodyCode = bodyCode.replace(
  /const afeValue = task\.customFields\?\.afe \|\| "—";[\s\S]*?return \([\s\S]*?<td key={col} className="border px-3 py-2 font-medium text-gray-700 text-right">[\s\S]*?{isPrinterTask \? \([\s\S]*?afeValue !== "—" \? `₹\${Number\(afeValue\)\.toLocaleString\("en-IN"\)}` : "—"[\s\S]*?\) : \([\s\S]*?<span className="text-gray-400">—<\/span>[\s\S]*?\)}(\s+)<\/td>\s+\);/m,
  `const afeValue = task.customFields?.afe || "—";
              const key = \`\${task.id}-afe\`;
              return (
                <td key={col} className="border px-3 py-2 font-medium text-gray-700 text-right">
                  {isPrinterTask ? (
                    editMode ? (
                      <input
                        type="number"
                        value={editedValues[key] ?? (task.customFields?.afe || "")}
                        onChange={(e) => handleInputChange(task.id, "afe", Number(e.target.value))}
                        onBlur={() => handleBlur(task.id, "afe")}
                        className="w-24 border rounded px-2"
                        placeholder="AFE"
                      />
                    ) : (
                      afeValue !== "—" ? \`₹\${Number(afeValue).toLocaleString("en-IN")}\` : "—"
                    )
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              );`
);

fs.writeFileSync(bodyPath, bodyCode);

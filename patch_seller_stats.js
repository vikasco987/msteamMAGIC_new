const fs = require('fs');
const path = './src/app/components/SellerStats.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add new state variables for Target Settings Modal
const stateVars = `
  // Target Settings Modal
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetSellerId, setTargetSellerId] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [isSavingTarget, setIsSavingTarget] = useState(false);
`;
code = code.replace(/const \[isDownloadingIncentive, setIsDownloadingIncentive\] = useState\(false\);/, "const [isDownloadingIncentive, setIsDownloadingIncentive] = useState(false);\n" + stateVars);

// 2. Add handleSaveTarget function
const saveTargetFn = `
  const handleSaveTarget = async () => {
    if (!targetSellerId || !targetAmount) return;
    setIsSavingTarget(true);
    try {
      const [y, m] = month.split('-');
      const res = await fetch("/api/seller-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: targetSellerId,
          month: m,
          year: y,
          target: targetAmount
        })
      });
      if (!res.ok) throw new Error("Failed to save target");
      
      setShowTargetModal(false);
      // Reload stats
      const statsRes = await fetch(\`/api/seller/stats?month=\${month}\${selectedAssignerId ? \`&assignerId=\${selectedAssignerId}\` : ''}\`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error(err);
      alert("Error saving target");
    } finally {
      setIsSavingTarget(false);
    }
  };
`;
code = code.replace(/useEffect\(\(\) => \{/, saveTargetFn + "\n  useEffect(() => {");

// 3. Add Settings button near Incentive Report
const settingsBtn = `
              {isMaster && (
                <button
                  onClick={() => setShowTargetModal(true)}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all"
                  title="Target Settings"
                >
                  <Settings size={16} /> Target Settings
                </button>
              )}
`;
code = code.replace(/<button\s+onClick=\{[^}]+\}\s+className="[^"]+"\s*>\s*<Download size=\{16\} \/> Incentive Report\s*<\/button>/, 
  `$&` + settingsBtn
);

// 4. Add the Target vs Achievement Card after the top stats cards
const targetCard = `
        {/* TARGET VS ACHIEVEMENT CARD */}
        {stats && (stats as any).status && (stats as any).status !== 'NO_TARGET' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 opacity-50"></div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <span>🎯</span> TARGET VS ACHIEVEMENT
                </h3>
                <div className="mt-2 flex items-baseline gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-400 uppercase">Monthly Target</span>
                    <span className="text-3xl font-black text-gray-900">{formatCurrency((stats as any).target)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-400 uppercase">Achieved</span>
                    <span className="text-3xl font-black text-blue-600">{formatCurrency(stats.totalRevenue)}</span>
                  </div>
                </div>
              </div>

              <div className={\`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wider flex items-center gap-2 \${
                (stats as any).status === 'ACHIEVED' ? 'bg-green-100 text-green-700' :
                (stats as any).status === 'ON_TRACK' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }\`}>
                {(stats as any).status === 'ACHIEVED' && '🏆 Target Achieved'}
                {(stats as any).status === 'ON_TRACK' && '🟡 On Track'}
                {(stats as any).status === 'BEHIND' && '🔴 Behind Target'}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-gray-600">Progress</span>
                <span className="text-blue-600">
                  {((stats as any).achievementPercentage).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden relative">
                <div 
                  className={\`h-full rounded-full transition-all duration-1000 \${
                    (stats as any).achievementPercentage >= 100 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                    'bg-gradient-to-r from-blue-400 to-blue-500'
                  }\`}
                  style={{ width: \`\${Math.min((stats as any).achievementPercentage, 100)}%\` }}
                />
              </div>
              {(stats as any).achievementPercentage > 100 && (
                <div className="text-xs font-bold text-green-600 mt-2 text-right">
                  Extra Sales: {formatCurrency(stats.totalRevenue - (stats as any).target)}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Remaining</span>
                <span className="text-lg font-bold text-gray-800">{formatCurrency((stats as any).remaining)}</span>
              </div>
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Days Remaining</span>
                <span className="text-lg font-bold text-gray-800">{(stats as any).daysRemaining} Days</span>
              </div>
              <div className="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-gray-200 pt-3 md:pt-0 md:pl-4">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                  {(stats as any).daysRemaining === 0 ? 'Required Today' : 'Required Daily'}
                </span>
                <span className="text-lg font-bold text-gray-800">{formatCurrency((stats as any).requiredDaily)}</span>
              </div>
            </div>
          </motion.div>
        )}

        {stats && (stats as any).status === 'NO_TARGET' && isMaster && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-6 flex flex-col items-center justify-center text-center space-y-3"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400">
              🎯
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-700">Monthly Target Not Set</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Admin/Master can set a target for this seller to track their sales performance and daily requirements.
              </p>
            </div>
            <button
              onClick={() => { setTargetSellerId(selectedAssignerId || assignees[0]?.id || ""); setShowTargetModal(true); }}
              className="mt-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all"
            >
              Set Target Now
            </button>
          </motion.div>
        )}
`;
code = code.replace(/<\/motion\.div>\s*\n\s*<\/div>\s*\n\s*\{\/\* History Table \*\/\}/m, "</motion.div>\n        </div>\n\n" + targetCard + "\n\n        {/* History Table */}");

// 5. Add Modal UI at the bottom of the component
const modalUI = `
      {/* TARGET SETTINGS MODAL */}
      <AnimatePresence>
        {showTargetModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowTargetModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <Settings size={20} className="text-blue-500" /> Target Settings
                </h3>
                <button onClick={() => setShowTargetModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Seller</label>
                  <select 
                    value={targetSellerId} 
                    onChange={(e) => setTargetSellerId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Seller...</option>
                    {assignees.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Month</label>
                  <input 
                    type="month" 
                    value={month} 
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Change the month filter at the top to set target for a different month.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Monthly Target (₹)</label>
                  <input 
                    type="number" 
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="e.g. 50000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-8">
                <button 
                  onClick={() => setShowTargetModal(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveTarget}
                  disabled={!targetSellerId || !targetAmount || isSavingTarget}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingTarget ? <Loader2 size={16} className="animate-spin" /> : null}
                  Save Target
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
`;
code = code.replace(/<\/div>\s*<\/div>\s*\)\;\s*\}\s*$/m, "      " + modalUI + "\n    </div>\n  );\n}");

fs.writeFileSync(path, code);
console.log("SellerStats patched successfully");

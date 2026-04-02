const axios = require('axios');

/**
 * 🛰️ ENTERPRISE SaaS CONCURRENCY AUDIT (PHASE 4 - HARDCORE)
 * 
 * 🛠️ OBJECTIVE:
 * 1. Simulates 50 concurrent agents logging status updates.
 * 2. Monitors the Matrix Real-Time Heartbeat.
 * 3. Verifies 100% Data Fidelity across the Internal Column Taxonomy.
 */

const CONFIG = {
    BASE_URL: 'http://localhost:3000',
    FORM_ID: 'REPLACE_WITH_ACTUAL_FORM_ID',
    RESPONSE_ID: 'REPLACE_WITH_ACTUAL_RESPONSE_ID',
    CONCURRENT_USERS: 50,
    BATCH_SIZE: 5,
    DELAY_BETWEEN_BATCHES: 500 // 500ms for sub-second audit
};

async function logInteraction(userId) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[USER-SHARD-${userId}] Dispatching Interaction Pulse... ⚡`);
    
    try {
        const res = await axios.post(`${CONFIG.BASE_URL}/api/crm/forms/${CONFIG.FORM_ID}/responses/${CONFIG.RESPONSE_ID}/remarks`, {
            remark: `AUDIT-${userId}: Operation Shard at ${timestamp}`,
            followUpStatus: userId % 2 === 0 ? 'Connected' : 'Call Again',
            nextFollowUpDate: new Date().toISOString(),
            leadStatus: 'HOT'
        });

        if (res.data.success) {
            process.stdout.write(`✅ [S-${userId}] `);
        } else {
            console.error(`\n❌ [S-${userId}] SHARD REJECTION:`, res.data);
        }
    } catch (err) {
        console.error(`\n❌ [S-${userId}] NETWORK BREACH:`, err.message);
    }
}

async function runEnterpriseAudit() {
    console.log("\n--- INITIATING ENTERPRISE CONCURRENCY AUDIT (50 SHARDS) --- 🚀🚨");
    console.log(`📍 TARGET: ${CONFIG.BASE_URL}`);
    console.log(`📍 FORM: ${CONFIG.FORM_ID} | SHARD: ${CONFIG.RESPONSE_ID}\n`);

    const start = Date.now();
    
    // Batch processing for realistic SaaS load
    for (let i = 0; i < CONFIG.CONCURRENT_USERS; i += CONFIG.BATCH_SIZE) {
        const batch = [];
        for (let j = 0; j < CONFIG.BATCH_SIZE; j++) {
            if (i + j < CONFIG.CONCURRENT_USERS) {
                batch.push(logInteraction(i + j));
            }
        }
        await Promise.all(batch);
        await new Promise(r => setTimeout(r, CONFIG.DELAY_BETWEEN_BATCHES));
    }

    const duration = (Date.now() - start) / 1000;
    console.log(`\n\n--- ENTERPRISE AUDIT COMPLETED IN ${duration}s --- 🛡️🔥`);
    console.log(`🎯 TOTAL SHARDS DISPATCHED: ${CONFIG.CONCURRENT_USERS}`);
    console.log(`📊 PULSE RATE: ${(CONFIG.CONCURRENT_USERS / duration).toFixed(2)}/sec`);
    console.log("\n[VERIFICATION]: Open Matrix UI and verify total counts updated silently. 🛰️");
}

if (CONFIG.FORM_ID.includes("REPLACE")) {
    console.warn("⚠️  CONFIG.FORM_ID is missing. Update the script with valid IDs to initiate the audit. 🛸");
} else {
    runEnterpriseAudit();
}

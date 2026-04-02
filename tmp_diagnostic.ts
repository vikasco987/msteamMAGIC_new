import { prisma } from "./src/lib/prisma.ts";
import { startOfDay, endOfDay } from "date-fns";

async function diagnose() {
    const targetDate = new Date(); // March 31
    const start = startOfDay(targetDate);
    const end = endOfDay(targetDate);

    console.log(`Diagnosing for: ${start.toISOString()} to ${end.toISOString()}`);

    const kapilId = "user_2z35tHhSiaA3MhizM0AnAnEks6x"; // Guessing Kapil's ID or find by name
    const kapil = await prisma.user.findFirst({ where: { name: { contains: "Kapil", mode: 'insensitive' } } });
    
    if (!kapil) {
        console.log("Kapil not found in DB!");
        return;
    }

    const uid = kapil.clerkId;
    console.log(`Found Kapil: ${kapil.name} (${uid})`);

    const [remarks, responses] = await Promise.all([
        prisma.formRemark.findMany({ where: { createdById: uid, createdAt: { gte: start, lte: end } } }),
        prisma.formResponse.findMany({ where: { submittedBy: uid, submittedAt: { gte: start, lte: end } } })
    ]);

    console.log(`Kapil Remarks Today: ${remarks.length}`);
    console.log(`Kapil Submissions Today: ${responses.length}`);

    // Check unique leads touched
    const uniqueLeads = new Set(remarks.map(r => r.responseId)).size;
    console.log(`Kapil Unique Leads Touched: ${uniqueLeads}`);

    // Check connected status matches
    const connectedStatuses = [
        "CALL DONE", "CALL AGAIN", "MEETING", "DUPLICATE", "CONNECTED", "INTERESTED", "BUSY",
        "Call Again", "Call done", "Not interested", "Walk-in scheduled", "Closed", "Follow up done", "Called", "Scheduled", "Follow-up Done", "Walked In",
        "ONBOARDED", "ONBOARDING", "PAYMENT PENDING", "FOLLOW-UP DONE", "WALKED IN", "INTERESTED", "BUSY", "CONNECTED", "SALES", "CLOSED", "SCHEDULED"
    ];
    
    const connected = remarks.filter(r => connectedStatuses.map(s => s.toUpperCase()).includes((r.followUpStatus || "").trim().toUpperCase()));
    console.log(`Kapil Connected Today: ${new Set(connected.map(r => r.responseId)).size}`);
}

diagnose();

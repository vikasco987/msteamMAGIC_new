
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const formId = "69b8f819a8a6f09fd11148c7";
    const form = await prisma.dynamicForm.findUnique({
        where: { id: formId },
        include: { fields: true, internalColumns: true }
    });
    
    console.log("Form Title:", form?.title);
    console.log("Fields:", JSON.stringify(form?.fields.map(f => ({ id: f.id, label: f.label, type: f.type })), null, 2));
    console.log("Internal Columns:", JSON.stringify(form?.internalColumns.map(i => ({ id: i.id, label: i.label, type: i.type })), null, 2));
    
    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });

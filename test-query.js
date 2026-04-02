const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        console.log("Checking DB records...");
        const forms = await prisma.dynamicForm.findMany({ take: 1 });
        const formId = forms[0].id;

        const firstResponseValues = await prisma.responseValue.findFirst({
            where: { response: { formId } }
        });
        
        console.log("First ResponseValue:", firstResponseValues);
        
        if (firstResponseValues) {
            const val = firstResponseValues.value;
            console.log("Testing insensitive query on:", val);
            const found = await prisma.responseValue.findFirst({
                where: {
                    fieldId: firstResponseValues.fieldId,
                    value: { equals: val, mode: 'insensitive' },
                    response: { formId }
                }
            });
            console.log("Found with insensitive:", !!found);
        }

    } catch (e) {
        console.log("Error:", e.message);
    }
}
test().finally(() => prisma.$disconnect());

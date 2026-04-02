// app/api/field-structure/route.ts
export async function GET() {
  const fields = [
    "shopName",
    "phone",
    "email",
    "location",
    "accountNumber",
    "ifscCode",
  ];

  return new Response(JSON.stringify(fields), {
    headers: { "Content-Type": "application/json" },
  });
}

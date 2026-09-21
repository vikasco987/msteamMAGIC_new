import sys

file_path = '/Users/vikas/msteamMAGIC_new/src/app/api/admin/sidebar/per-role/route.ts'
with open(file_path, 'r') as f:
    content = f.read()

# Replace Payment Portal with new ones
content = content.replace("'Payment Portal'", "'Payment Portal Magic Scale', 'Onboard Magic Scale'")

# Add force-dynamic if not present
if "export const dynamic = 'force-dynamic';" not in content:
    content = content.replace('export async function GET(req: NextRequest) {', "export const dynamic = 'force-dynamic';\n\nexport async function GET(req: NextRequest) {")

with open(file_path, 'w') as f:
    f.write(content)
print("per-role API updated")

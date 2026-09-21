import sys

file_path = '/Users/vikas/msteamMAGIC_new/src/app/api/admin/sidebar/route.ts'
with open(file_path, 'r') as f:
    content = f.read()

# Replace in allItems
content = content.replace(
    "'Payment Portal'",
    "'Payment Portal Magic Scale', 'Onboard Magic Scale'"
)

# This will magically replace it in the DEFAULT_PERMISSIONS array too because they use the exact string "'Payment Portal'"!

with open(file_path, 'w') as f:
    f.write(content)
print("API updated")

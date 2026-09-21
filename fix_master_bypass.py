import sys

file_path = '/Users/vikas/msteamMAGIC_new/src/app/components/Sidebar.tsx'
with open(file_path, 'r') as f:
    content = f.read()

old_logic = "if (userRole === 'master' && (i.label === 'Access Control' || i.label === 'Business Setup' || i.label === 'Payment Portal Magic Scale' || i.label === 'Onboard Magic Scale' || i.label === 'Profit & Loss')) {"
new_logic = "if (userRole === 'master' && (i.label === 'Access Control' || i.label === 'Business Setup' || i.label === 'Profit & Loss')) {"

if old_logic in content:
    content = content.replace(old_logic, new_logic)
    with open(file_path, 'w') as f:
        f.write(content)
    print("Updated Sidebar logic successfully.")
else:
    print("Error: Old logic not found!")

import sys

file_path = '/Users/vikas/msteamMAGIC_new/src/app/components/Sidebar.tsx'
with open(file_path, 'r') as f:
    content = f.read()

old_logic = """              // If we have dynamic permissions, they override or restrict
              if (dynamicPermissions !== null) {
                // Safety Lock: Master should always see Access Control & Business Setup to avoid locking out
                if (userRole === 'master' && (i.label === 'Access Control' || i.label === 'Business Setup' || i.label === 'Payment Portal' || i.label === 'Profit & Loss')) {
                  hasPermission = true;
                } else if (i.label === 'Agreements' || i.label === 'Setup Agreement' || i.label === 'My Details') {
                  hasPermission = hasHardcodedRole;
                } else {
                  hasPermission = dynamicPermissions.includes(i.label);
                }
              }"""

new_logic = """              // If we have dynamic permissions, they override or restrict
              if (dynamicPermissions !== null) {
                // Safety Lock: Master should always see Access Control & Business Setup to avoid locking out
                if (userRole === 'master' && (i.label === 'Access Control' || i.label === 'Business Setup' || i.label === 'Payment Portal' || i.label.startsWith('Payment Links (Gateway') || i.label === 'Profit & Loss')) {
                  hasPermission = true;
                } else if (i.label === 'Agreements' || i.label === 'Setup Agreement' || i.label === 'My Details') {
                  hasPermission = hasHardcodedRole;
                } else if (i.label.startsWith('Payment Links (Gateway')) {
                  hasPermission = dynamicPermissions.includes('Payment Portal') || dynamicPermissions.includes(i.label);
                } else {
                  hasPermission = dynamicPermissions.includes(i.label);
                }
              }"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)
    with open(file_path, 'w') as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Old logic not found!")

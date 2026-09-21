import sys

file_path = '/Users/vikas/msteamMAGIC_new/src/app/components/Sidebar.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# 1. Update the items
content = content.replace(
    "{ label: 'Payment Portal', icon: CreditCard, href: '/payment-portal', roles: ['admin', 'master', 'seller', 'tl', 'user', 'manager', 'intern', 'guest'] },",
    "{ label: 'Payment Portal Magic Scale', icon: CreditCard, href: '/payment-portal', roles: ['admin', 'master', 'seller', 'tl', 'user', 'manager', 'intern', 'guest'] },",
    1
)
content = content.replace(
    "{ label: 'Payment Portal', icon: CreditCard, href: '/payment-portal-2', roles: ['admin', 'master', 'seller', 'tl', 'user', 'manager', 'intern', 'guest'] },",
    "{ label: 'Onboard Magic Scale', icon: CreditCard, href: '/payment-portal-2', roles: ['admin', 'master', 'seller', 'tl', 'user', 'manager', 'intern', 'guest'] },",
    1
)

# 2. Update the master check logic
old_logic = "i.label === 'Payment Portal' || i.label.startsWith('Payment Links (Gateway') || i.label === 'Profit & Loss'"
new_logic = "i.label === 'Payment Portal Magic Scale' || i.label === 'Onboard Magic Scale' || i.label === 'Profit & Loss'"
content = content.replace(old_logic, new_logic)

# Remove the specific Payment Links condition from my previous script since we don't need it now
# We can just let it fall back to the default `dynamicPermissions.includes(i.label)` because now the labels are unique and map exactly to the DB!
old_logic_block = """                } else if (i.label.startsWith('Payment Links (Gateway')) {
                  hasPermission = dynamicPermissions.includes('Payment Portal') || dynamicPermissions.includes(i.label);
                } else {
                  hasPermission = dynamicPermissions.includes(i.label);
                }"""
new_logic_block = """                } else {
                  hasPermission = dynamicPermissions.includes(i.label);
                }"""
content = content.replace(old_logic_block, new_logic_block)

# 3. Update rendering
old_render = "{item.label}"
new_render = "{item.label === 'Payment Portal Magic Scale' || item.label === 'Onboard Magic Scale' ? 'Payment Portal' : item.label}"
content = content.replace(old_render, new_render)

with open(file_path, 'w') as f:
    f.write(content)
print("Sidebar updated")

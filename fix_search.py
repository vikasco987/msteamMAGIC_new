import sys

file_path = '/Users/vikas/msteamMAGIC_new/src/app/components/Sidebar.tsx'
with open(file_path, 'r') as f:
    content = f.read()

old_logic = """              if (searchTerm.trim() !== "") {
                return i.label.toLowerCase().includes(searchTerm.toLowerCase());
              }"""

new_logic = """              if (searchTerm.trim() !== "") {
                const searchStr = searchTerm.toLowerCase();
                const displayLabel = (i.label === 'Payment Portal Magic Scale' || i.label === 'Onboard Magic Scale') ? 'Payment Portal' : i.label;
                return i.label.toLowerCase().includes(searchStr) || displayLabel.toLowerCase().includes(searchStr);
              }"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)
    with open(file_path, 'w') as f:
        f.write(content)
    print("Search logic updated successfully.")
else:
    print("Error: Old search logic not found!")

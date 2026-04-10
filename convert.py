import sys
import re

file_path = r'd:\Agentic_Healthcare_AI\FULL_PRESENTATION_DOCUMENTATION.md'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
in_table = False
headers = []

for line in lines:
    if line.strip().startswith('|') and line.strip().endswith('|'):
        # Skip separator lines
        if re.match(r'^\|[\-\|\s]+\|$', line.strip()):
            continue
        
        cells = [c.strip() for c in line.strip().split('|')[1:-1]]
        
        if not in_table:
            # First row of a new table (headers)
            headers = cells
            in_table = True
            new_lines.append('\n') # add space before list
        else:
            # Data row
            if len(headers) > 0 and len(cells) > 0:
                # Format: - **Col1**: Col2 | Col3
                try:
                    main_item = cells[0]
                    # if main_item is not bolded already, bold it. If it is bolded, keep it.
                    if not main_item.startswith('**'):
                        main_item = f"**{main_item}**"
                    
                    rest = " | ".join(cells[1:])
                    # if there is a third column or more, use "—" instead of " | " for the first delimiter if possible, but " | " is fine.
                    if len(cells) == 2:
                        row_str = f"- {main_item}: {cells[1]}\n"
                    else:
                        row_str = f"- {main_item}: {' | '.join(cells[1:])}\n"
                    new_lines.append(row_str)
                except Exception as e:
                    new_lines.append(line) # fallback
    else:
        in_table = False
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('Converted all tables to lists successfully!')

#!/usr/bin/env python3
"""
Convert SmartPy contracts from @sp.module syntax to legacy syntax
Compatible with SmartPy 0.2.2
"""

import re
import sys

def convert_contract(input_file, output_file):
    """Convert a contract file to legacy syntax"""
    with open(input_file, 'r') as f:
        content = f.read()
    
    # Remove @sp.module decorator and its function wrapper
    content = re.sub(r'@sp\.module\s+def\s+main\(\):\s+', '', content)
    
    # Fix indentation - remove one level of indentation from class definitions
    lines = content.split('\n')
    new_lines = []
    in_main_block = False
    
    for line in lines:
        # Skip the main() function definition line
        if '@sp.module' in line or 'def main():' in line:
            continue
            
        # Remove one level of indentation from content that was inside main()
        if line.startswith('    ') and not line.strip().startswith('#'):
            new_lines.append(line[4:])  # Remove 4 spaces
        else:
            new_lines.append(line)
    
    content = '\n'.join(new_lines)
    
    # Convert type annotations to legacy format
    content = content.replace('sp.record(', 'sp.TRecord(')
    content = content.replace('sp.big_map[', 'sp.TBigMap(')
    content = content.replace('sp.set[', 'sp.TSet(')
    content = content.replace('sp.map[', 'sp.TMap(')
    content = content.replace('sp.nat', 'sp.TNat')
    content = content.replace('sp.bool', 'sp.TBool')
    content = content.replace('sp.string', 'sp.TString')
    content = content.replace('sp.address', 'sp.TAddress')
    content = content.replace('sp.timestamp', 'sp.TTimestamp')
    content = content.replace('sp.mutez', 'sp.TMutez')
    
    # Fix type variable declarations
    content = re.sub(r'(\w+)_type:\s*type\s*=\s*', r'\1_type = ', content)
    
    # Convert self.data.field initialization to self.init()
    # This is more complex and may need manual adjustment
    
    with open(output_file, 'w') as f:
        f.write(content)
    
    print(f"Converted {input_file} -> {output_file}")

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python convert_to_legacy_syntax.py <input_file> <output_file>")
        sys.exit(1)
    
    convert_contract(sys.argv[1], sys.argv[2])

import json
import os
import shutil
import sys
from html import escape

# Configuration
OUTPUT_DIR = 'dist'
VIEWER_DIR = 'viewer'

def load_data(input_file):
    print(f"Loading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def process_document(doc_id, doc_data):
    """
    Process a single document:
    1. Reconstruct the tree structure.
    2. Identify the root.
    3. Return a clean data structure for the viewer.
    """
    nodes = doc_data.get('nodes', {})
    
    # If nodes is a list (some versions of Loom might do this), convert to dict
    if isinstance(nodes, list):
        nodes = {n['id']: n for n in nodes}
    
    # Build children lists and find root
    processed_nodes = {}
    root_id = None
    
    # First pass: Copy nodes and initialize children
    for nid, node in nodes.items():
        processed_nodes[nid] = {
            'id': nid,
            'content': node.get('value', '') or node.get('text', ''), # Handle different keys
            'parentId': node.get('parentId'),
            'children': []
        }
    
    # Second pass: Link children
    for nid, node in processed_nodes.items():
        parent_id = node['parentId']
        if parent_id and parent_id in processed_nodes:
            processed_nodes[parent_id]['children'].append(nid)
        elif parent_id is None:
            # This is likely the root
            if root_id is not None:
                print(f"Warning: Multiple roots found in {doc_id}. Overwriting {root_id} with {nid}")
            root_id = nid
            
    # If no root found (e.g. empty doc or circular ref?), pick one without parent
    if root_id is None and processed_nodes:
        print(f"Warning: No explicit root found in {doc_id}. Picking arbitrary node.")
        root_id = list(processed_nodes.keys())[0]

    return {
        'rootId': root_id,
        'nodes': processed_nodes
    }

def generate_site(input_file='data.json'):
    # 1. Prepare Output Directory
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR)
    
    # 2. Copy Assets
    print("Copying assets...")
    shutil.copy(os.path.join(VIEWER_DIR, 'style.css'), OUTPUT_DIR)
    shutil.copy(os.path.join(VIEWER_DIR, 'viewer.js'), OUTPUT_DIR)
    
    # 3. Load Templates
    with open(os.path.join(VIEWER_DIR, 'template.html'), 'r', encoding='utf-8') as f:
        doc_template = f.read()
    with open(os.path.join(VIEWER_DIR, 'index_template.html'), 'r', encoding='utf-8') as f:
        index_template = f.read()

    # 4. Process Data
    data = load_data(input_file)
    state = data.get('state', {})
    
    doc_list_items = []
    
    print(f"Found {len(state)} documents.")
    
    for doc_filename, doc_data in state.items():
        # Clean filename for URL
        safe_name = "".join([c for c in doc_filename if c.isalnum() or c in (' ', '-', '_', '.')]).strip()
        html_filename = safe_name + ".html"
        
        print(f"Generating {html_filename}...")
        
        # Process Document Data
        clean_data = process_document(doc_filename, doc_data)
        
        # Render HTML
        json_data = json.dumps(clean_data)
        html_content = doc_template.replace('{{ title }}', escape(doc_filename))
        html_content = html_content.replace('{{ doc_data_json }}', json_data)
        
        with open(os.path.join(OUTPUT_DIR, html_filename), 'w', encoding='utf-8') as f:
            f.write(html_content)
            
        # Add to Index List
        doc_list_items.append(f'<li class="doc-item"><a href="{html_filename}" class="doc-link"><span class="doc-title">{escape(doc_filename)}</span><span class="doc-meta">{len(clean_data["nodes"])} nodes</span></a></li>')

    # 5. Generate Index Page
    print("Generating index.html...")
    index_html = index_template.replace('{{ doc_list_items }}', '\n'.join(doc_list_items))
    with open(os.path.join(OUTPUT_DIR, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(index_html)
        
    print("Done!")

if __name__ == '__main__':
    input_file = sys.argv[1] if len(sys.argv) > 1 else 'data.json'
    generate_site(input_file)

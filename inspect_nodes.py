import json
import sys

try:
    with open('data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    state = data.get('state', {})
    
    # Get the first document key
    first_doc_key = list(state.keys())[0]
    print(f"Analyzing document: {first_doc_key}")
    
    doc = state[first_doc_key]
    if 'nodes' in doc:
        nodes = doc['nodes']
        print(f"Nodes type: {type(nodes)}")
        
        if isinstance(nodes, dict):
            print(f"Number of nodes: {len(nodes)}")
            first_node_id = list(nodes.keys())[0]
            first_node = nodes[first_node_id]
            print(f"Sample node ID: {first_node_id}")
            print(f"Sample node keys: {list(first_node.keys())}")
            print(f"Sample node content: {json.dumps(first_node, indent=2)[:500]}...")
            
            # Check for tree structure indicators
            if 'children' in first_node:
                print("Node has 'children' key.")
            if 'parent' in first_node:
                print("Node has 'parent' key.")
        elif isinstance(nodes, list):
             print(f"Nodes is a list of length {len(nodes)}")
             print(f"Sample node: {nodes[0]}")

except Exception as e:
    print(f"Error: {e}")

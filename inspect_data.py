import json
import sys

try:
    with open('data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    state = data.get('state', {})
    print(f"State type: {type(state)}")
    
    if isinstance(state, dict):
        print(f"State keys: {list(state.keys())}")
        
        # Check for likely document containers
        for key in state:
            val = state[key]
            if isinstance(val, list):
                print(f"Key '{key}' is a list of length {len(val)}")
                if len(val) > 0:
                    print(f"  Sample item keys in '{key}': {list(val[0].keys())}")
                    # Check for continuations in the first item
                    if 'continuations' in val[0]:
                        print(f"  Found 'continuations' in '{key}' items!")
                        print(f"  Continuations type: {type(val[0]['continuations'])}")
                        print(f"  Continuations sample: {str(val[0]['continuations'])[:200]}...")
            elif isinstance(val, dict):
                print(f"Key '{key}' is a dict with keys {list(val.keys())}")

except Exception as e:
    print(f"Error: {e}")

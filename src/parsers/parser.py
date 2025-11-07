from typing import Dict


def parse_input(text: str) -> Dict:
    """Very small parser for ErrorCook context patch inputs.

    This placeholder parses a simple key:value style blocks separated by newlines
    and returns a nested dictionary. The real implementation should be extended
    to handle the full schema used by ErrorCook/ContextPatch.
    """
    result = {}
    current = None
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        if ':' in line and not line.startswith('-'):
            key, value = line.split(':', 1)
            key, value = key.strip(), value.strip()
            current = key
            result[current] = value
        elif line.startswith('-') and current:
            value = line.lstrip('-').strip()
            # accumulate into a list under the current key if not present
            if isinstance(result.get(current), list):
                result[current].append(value)
            else:
                result[current] = [value]
    return result

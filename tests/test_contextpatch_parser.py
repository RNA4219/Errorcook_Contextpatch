
from contextpatch.parser import ContextPatchParser


def test_parse_basic():
    parser = ContextPatchParser()
    text = "ERR_UNKNOWN: something failed"
    result = parser.parse(text)
    assert isinstance(result, dict)
    assert result["raw_text"] == text
    assert result["parsed"] is True

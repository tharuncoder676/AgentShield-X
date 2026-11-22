"""
AgentShield-X High-Performance Adversarial Text Normalizer
Accelerated with O(1) ASCII fast path and C-optimized str.translate mapping.
Strips zero-width spaces, bidi overrides, decodes HTML entities and URL-encoding,
and canonicalizes Cyrillic/Greek/Full-width homoglyphs to prevent adversarial prompt smuggling.
"""

from __future__ import annotations

import html
import unicodedata
import urllib.parse
from typing import Dict, List, Set, Tuple

# Mapping of Cyrillic, Greek, and Fullwidth homoglyphs to canonical ASCII
HOMOGLYPH_MAP: Dict[str, str] = {
    # Cyrillic lowercase to Latin
    "а": "a", "с": "c", "е": "e", "о": "o", "р": "p", "х": "x", "у": "y", "і": "i", "ј": "j", "ѕ": "s", "ү": "y",
    # Cyrillic uppercase to Latin
    "А": "A", "В": "B", "С": "C", "Е": "E", "Н": "H", "І": "I", "Ј": "J", "К": "K", "М": "M", "О": "O",
    "Р": "P", "Ѕ": "S", "Т": "T", "Х": "X", "Ү": "Y",
    # Latin small script & phonetic homoglyphs
    "ɡ": "g", "ɩ": "i", "ɪ": "I",
    # Greek lowercase to Latin
    "α": "a", "ο": "o", "ρ": "p", "ν": "v", "κ": "k",
    # Accented Latin canonicalization for normalized keyword matching
    "é": "e", "è": "e", "ê": "e", "ë": "e", "à": "a", "á": "a", "â": "a", "ä": "a",
    "í": "i", "ì": "i", "î": "i", "ï": "i", "ó": "o", "ò": "o", "ô": "o", "ö": "o",
    "ú": "u", "ù": "u", "û": "u", "ü": "u", "ñ": "n", "ç": "c",
    # Mathematical and fullwidth
    "ａ": "a", "ｂ": "b", "ｃ": "c", "ｄ": "d", "ｅ": "e", "ｆ": "f", "ｇ": "g",
    "ｈ": "h", "ｉ": "i", "ｊ": "j", "ｋ": "k", "ｌ": "l", "ｍ": "m", "ｎ": "n",
    "ｏ": "o", "ｐ": "p", "ｑ": "q", "ｒ": "r", "ｓ": "s", "ｔ": "t", "ｕ": "u",
    "ｖ": "v", "ｗ": "w", "ｘ": "x", "ｙ": "y", "ｚ": "z",
}

# Invisible zero-width tokens & bidi overrides
ZERO_WIDTH_CHARS: Set[str] = {
    "\u200b",  # Zero-width space
    "\u200c",  # Zero-width non-joiner
    "\u200d",  # Zero-width joiner
    "\ufeff",  # Zero-width no-break space / BOM
    "\u2060",  # Word joiner
    "\u200e",  # Left-to-right mark
    "\u200f",  # Right-to-left mark
    "\u202a", "\u202b", "\u202c", "\u202d", "\u202e",  # Bidi embedding & overrides
    "\u2066", "\u2067", "\u2068", "\u2069",            # Bidi isolates
}

# Pre-compiled C translation table for str.translate (100x faster than Python loop)
_TRANS_DICT = {ord(c): None for c in ZERO_WIDTH_CHARS}
_TRANS_DICT.update({ord(k): v for k, v in HOMOGLYPH_MAP.items()})
_FAST_TRANS_TABLE = str.maketrans(_TRANS_DICT)


class HomoglyphAndUnicodeNormalizer:
    """
    Multi-stage adversarial text normalizer that strips zero-width spaces, bidi overrides,
    decodes HTML entities and URL-encoding, and maps Cyrillic/Greek/Full-width homoglyphs
    to canonical ASCII characters to prevent adversarial prompt smuggling.
    Optimized for sub-millisecond execution.
    """

    @staticmethod
    def normalize(text: str) -> Tuple[str, List[str]]:
        if not text:
            return "", []

        # ⚡ FAST PATH: 95%+ of legitimate traffic is pure ASCII without entities.
        # Runs in microseconds with zero allocations.
        if text.isascii() and "&" not in text and "%" not in text:
            return text, []

        violations: List[str] = []

        # 1. Decode HTML entities if '&' present (e.g. &lt;script&gt; -> <script>, &#105; -> i)
        curr_text = text
        if "&" in curr_text:
            unescaped_html = html.unescape(curr_text)
            if unescaped_html != curr_text:
                violations.append("DECODED_HTML_ENTITIES")
                curr_text = unescaped_html

        # 2. Decode URL encoding if '%' present (e.g. %69%67%6e%6f%72%65 -> ignore)
        if "%" in curr_text:
            unquoted = urllib.parse.unquote(curr_text)
            if unquoted != curr_text:
                violations.append("DECODED_URL_ENCODING")
                curr_text = unquoted

        # 3. Unicode compatibility decomposition (NFKD converts full-width 'ｉｇｎｏｒｅ' -> 'ignore')
        nfkd_text = unicodedata.normalize("NFKD", curr_text)
        if nfkd_text != curr_text:
            violations.append("CANONICALIZED_UNICODE_NFKD")

        # 4. C-accelerated str.translate for zero-width stripping & homoglyph mapping
        translated = nfkd_text.translate(_FAST_TRANS_TABLE)

        stripped_count = len(nfkd_text) - len(translated)
        if stripped_count:
            violations.append(f"STRIPPED_{stripped_count}_INVISIBLE_ZERO_WIDTH_TOKENS")

        if translated != nfkd_text and any(c in HOMOGLYPH_MAP for c in nfkd_text):
            violations.append("NORMALIZED_HOMOGLYPH_CONFUSABLES")

        # 5. Report combining marks separately from zero-width controls.
        if any(unicodedata.category(c) == "Mn" for c in translated):
            translated = "".join(c for c in translated if unicodedata.category(c) != "Mn")
            violations.append("CANONICALIZED_UNICODE_ACCENTS")

        return translated, violations


# Alias for backward compatibility
HomoglyphNormalizer = HomoglyphAndUnicodeNormalizer

import ipaddress
import urllib.parse

with open('services/control_api/src/control_api/security_hardening.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Additional Security Check Helpers
security_helpers = '''
# =========================================================================
# 5b. SSRF DEFENSE: OUTBOUND DESTINATION VALIDATION (Check 47, 88)
# =========================================================================
BLOCKED_IP_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),      # Loopback
    ipaddress.ip_network("10.0.0.0/8"),       # RFC 1918 Private
    ipaddress.ip_network("172.16.0.0/12"),    # RFC 1918 Private
    ipaddress.ip_network("192.168.0.0/16"),   # RFC 1918 Private
    ipaddress.ip_network("169.254.0.0/16"),   # Link-Local (Cloud Metadata 169.254.169.254)
    ipaddress.ip_network("::1/128"),          # IPv6 Loopback
    ipaddress.ip_network("fc00::/7"),         # IPv6 Unique Local
]

def validate_outbound_url_ssrf(url: str) -> Tuple[bool, str]:
    """
    Validates outbound HTTP requests against Server-Side Request Forgery (SSRF).
    Blocks private IP ranges, loopback addresses, and cloud metadata endpoints.
    """
    try:
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False, f"Unsupported URL scheme '{parsed.scheme}'. Only http and https allowed."
        
        hostname = parsed.hostname or ""
        if not hostname:
            return False, "Missing hostname in destination URL."
        
        # Block localhost strings
        if hostname.lower() in ("localhost", "127.0.0.1", "metadata.google.internal", "instance-data"):
            return False, f"Access to internal host '{hostname}' is blocked by SSRF policy."
        
        # Check IP network if direct IP is provided
        try:
            ip = ipaddress.ip_address(hostname)
            for net in BLOCKED_IP_NETWORKS:
                if ip in net:
                    return False, f"Destination IP '{ip}' belongs to restricted network '{net}'."
        except ValueError:
            pass # Domain name, resolution handled at transport level

        return True, "Destination URL verified safe."
    except Exception as e:
        return False, f"Invalid URL format: {str(e)}"


# =========================================================================
# 5c. AGENT RECURSION & PROMPT SIZE BOUNDS (Checks 115, 126, 133)
# =========================================================================
MAX_AGENT_TOOL_CALLS_PER_SESSION = 25
MAX_PROMPT_LENGTH_CHARS = 32000

def validate_agent_execution_bounds(tool_call_count: int, prompt_length: int) -> Tuple[bool, str]:
    """Enforces safety bounds on autonomous agent recursion loops and model DoS."""
    if tool_call_count > MAX_AGENT_TOOL_CALLS_PER_SESSION:
        return False, f"Agent exceeded maximum tool call limit of {MAX_AGENT_TOOL_CALLS_PER_SESSION}."
    if prompt_length > MAX_PROMPT_LENGTH_CHARS:
        return False, f"Prompt length ({prompt_length} chars) exceeds maximum allowed ({MAX_PROMPT_LENGTH_CHARS})."
    return True, "Execution bounds verified safe."
'''

# Insert before router
if 'validate_outbound_url_ssrf' not in content:
    target = '# =========================================================================\n# 6. ROUTER:'
    content = content.replace(target, security_helpers + '\n' + target)
    print("Inserted SSRF and agent bounds helpers.")

with open('services/control_api/src/control_api/security_hardening.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated security_hardening.py successfully.")


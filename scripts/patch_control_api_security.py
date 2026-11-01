with open('services/control_api/src/control_api/main.py', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add imports
import_marker = 'from control_api.routes.licensing import router as licensing_router'
new_imports = '''from control_api.routes.licensing import router as licensing_router
from control_api.security_hardening import (
    SecurityHeadersMiddleware,
    RateLimitMiddleware,
    SpendCapMiddleware,
    router as security_router,
    ALLOWED_ORIGINS,
    DEBUG_MODE,
)'''

if import_marker in code:
    code = code.replace(import_marker, new_imports)
    print("Added security imports to main.py")

# 2. Replace CORS and add security middlewares
old_cors = '''# Enable CORS for frontend applications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)'''

new_cors = '''# 1. Security Hardening Middlewares (Checks 8, 11, 12, 14, 16, 17, 18)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(SpendCapMiddleware)

# 2. Strict CORS Configuration (Check 15: No wildcard with credentials)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-Request-Id"],
)'''

norm_code = code.replace('\r\n', '\n')
old_cors_norm = old_cors.replace('\r\n', '\n')
new_cors_norm = new_cors.replace('\r\n', '\n')

if old_cors_norm in norm_code:
    norm_code = norm_code.replace(old_cors_norm, new_cors_norm)
    print("Replaced CORS with hardened middleware stack")
else:
    print("Warning: old_cors not matched directly")

# 3. Add security_router and 404 custom handler
router_marker = 'app.include_router(licensing_router)'
new_routers = '''app.include_router(licensing_router)
app.include_router(security_router)'''

if router_marker in norm_code:
    norm_code = norm_code.replace(router_marker, new_routers, 1)
    print("Added security_router to app")

custom_404 = '''
from fastapi.responses import JSONResponse

@app.exception_handler(404)
async def custom_api_404_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "error": "ROUTE_NOT_FOUND",
            "message": f"Endpoint '{request.url.path}' does not exist on AgentShield-X Control API.",
            "status_code": 404,
        }
    )
'''

if 'custom_api_404_handler' not in norm_code:
    norm_code += custom_404
    print("Added custom_api_404_handler")

with open('services/control_api/src/control_api/main.py', 'w', encoding='utf-8') as f:
    f.write(norm_code)

print("Updated control_api/main.py successfully.")


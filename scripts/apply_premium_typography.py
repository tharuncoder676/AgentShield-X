with open('apps/console/src/pages/Landing.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update brand lockup
target_brand = '<span className="font-chakra font-bold text-lg sm:text-xl tracking-wider text-white whitespace-nowrap">'
new_brand = '<span className="font-sora font-semibold text-lg sm:text-xl tracking-tight text-white whitespace-nowrap">'
if target_brand in content:
    content = content.replace(target_brand, new_brand, 1)
    print("Updated brand lockup to Sora font.")
else:
    print("Warning: target_brand not found.")

# 2. Update Primary Hero Headline to Sora Headline Sheen Effect
old_hero_headline = '''            {/* Main Headline: Matching Super App Cadence */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.75rem] font-bold tracking-tight text-white leading-[1.08] mb-6">
              The Agent Security<br />
              <span className="bg-gradient-to-r from-[#e9d5ff] via-[#c084fc] to-[#a855f7] bg-clip-text text-transparent">
                Super App.
              </span>
            </h1>'''

new_hero_headline = '''            {/* Main Headline: Premium Sora Headline Sheen Effect (84px Semibold -0.035em) */}
            <h1 className="headline-sheen text-5xl sm:text-6xl md:text-7xl lg:text-[84px] font-semibold tracking-[-0.035em] leading-[1.0] mb-6">
              <span className="block">The Agent Security</span>
              <span className="block">Super App.</span>
            </h1>'''

# Normalize CRLF vs LF
content_norm = content.replace('\r\n', '\n')
old_hero_norm = old_hero_headline.replace('\r\n', '\n')
new_hero_norm = new_hero_headline.replace('\r\n', '\n')

if old_hero_norm in content_norm:
    content_norm = content_norm.replace(old_hero_norm, new_hero_norm, 1)
    print("Updated Hero Headline with headline-sheen.")
else:
    print("Warning: old_hero_headline not found.")

# 3. Update Hero Subhead
old_subhead = '''            {/* Subhead: Natural, Human Copy */}
            <p className="text-base sm:text-lg md:text-xl text-[#a9a9aa] font-sans leading-relaxed mb-6 max-w-xl">
              AI agents that work while you don\'t worry. A native desktop workspace with deterministic runtime armor. Live coding threads with sub-millisecond guardrails you trust instead of watch.
            </p>'''

new_subhead = '''            {/* Subhead: Natural, Human Copy with Premium Sora Typography */}
            <p className="text-base sm:text-lg md:text-xl text-[#a9a9aa] font-sora font-normal leading-relaxed mb-6 max-w-xl text-balance">
              AI agents that work while you don\'t worry. A native desktop workspace with deterministic runtime armor. Live coding threads with sub-millisecond guardrails you trust instead of watch.
            </p>'''

old_subhead_norm = old_subhead.replace('\r\n', '\n')
new_subhead_norm = new_subhead.replace('\r\n', '\n')

if old_subhead_norm in content_norm:
    content_norm = content_norm.replace(old_subhead_norm, new_subhead_norm, 1)
    print("Updated Hero Subhead font to font-sora.")

# 4. Update section headlines to use section-headline
content_norm = content_norm.replace(
    '<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">',
    '<h2 className="section-headline text-3xl sm:text-4xl md:text-5xl mb-4">'
)
content_norm = content_norm.replace(
    '<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">',
    '<h2 className="section-headline text-3xl sm:text-4xl md:text-5xl mb-4">'
)
content_norm = content_norm.replace(
    '<h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">',
    '<h2 className="section-headline text-3xl sm:text-4xl md:text-5xl mb-4">'
)

with open('apps/console/src/pages/Landing.tsx', 'w', encoding='utf-8') as f:
    f.write(content_norm)

print("Saved updated Landing.tsx.")


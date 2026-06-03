filepath = r'app/api/trip-planner/route.ts'
with open(filepath, 'r', encoding='utf-8-sig') as f:
    content = f.read()

old = "VERIFIED AWARD RATES (use these exact figures):"
new = "AWARD RATES (use community intelligence sweet spots above when available, otherwise use these baselines — prefer creator-found rates over these):"

if old in content:
    content = content.replace(old, new)
    print("OK: trip-planner award rates label updated")
else:
    print("MISS")

# Add note that community sweet spots override hardcoded rates
old2 = "- BLR->BKK Economy (KrisFlyer): 20,000 miles one-way"
new2 = "- BLR->BKK Economy (KrisFlyer): 20,000 miles one-way\n- ALWAYS prefer sweet spots from community intelligence - creators find lower rates"
content = content.replace(old2, new2)

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print("done")

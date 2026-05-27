with open('components/design/FlightSearch.tsx', 'r', encoding='utf-8') as f:
    s = f.read()

# Add defaultTo to props
s = s.replace(
    "export function FlightSearch({ defaultFrom = 'DEL', pointsBalance = 0, bank = 'HDFC' }: { defaultFrom?: string; pointsBalance?: number; bank?: string })",
    "export function FlightSearch({ defaultFrom = 'DEL', defaultTo = '', pointsBalance = 0, bank = 'HDFC' }: { defaultFrom?: string; defaultTo?: string; pointsBalance?: number; bank?: string })"
)

# Use defaultTo in state
s = s.replace(
    "const [to, setTo] = useState('')",
    "const [to, setTo] = useState(defaultTo)"
)

with open('components/design/FlightSearch.tsx', 'w', encoding='utf-8') as f:
    f.write(s)
print('Done')

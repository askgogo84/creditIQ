with open('components/design/FlightSearch.tsx', 'r', encoding='utf-8') as f:
    s = f.read()

# Add city to IATA mapper after the AIRPORTS array
mapper = """
const CITY_TO_IATA: Record<string, string> = {
  'goa': 'GOI', 'mumbai': 'BOM', 'bombay': 'BOM', 'delhi': 'DEL',
  'new delhi': 'DEL', 'bangalore': 'BLR', 'bengaluru': 'BLR',
  'chennai': 'MAA', 'madras': 'MAA', 'kolkata': 'CCU', 'calcutta': 'CCU',
  'hyderabad': 'HYD', 'kochi': 'COK', 'cochin': 'COK', 'pune': 'PNQ',
  'ahmedabad': 'AMD', 'jaipur': 'JAI', 'lucknow': 'LKO', 'chandigarh': 'IXC',
  'singapore': 'SIN', 'dubai': 'DXB', 'bangkok': 'BKK', 'london': 'LHR',
  'tokyo': 'NRT', 'new york': 'JFK', 'paris': 'CDG', 'sydney': 'SYD',
}

function cityToIata(city: string): string {
  return CITY_TO_IATA[city.toLowerCase().trim()] || city.substring(0, 3).toUpperCase()
}
"""

s = s.replace("const POINTS_VALUE:", mapper + "\nconst POINTS_VALUE:")

# Use cityToIata for defaultTo
s = s.replace(
    "const [to, setTo] = useState(defaultTo)",
    "const [to, setTo] = useState(defaultTo ? cityToIata(defaultTo) : '')"
)

with open('components/design/FlightSearch.tsx', 'w', encoding='utf-8') as f:
    f.write(s)
print('Done')

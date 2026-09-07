// Re-run marker: Preview environment access enabled for the AwardTool evaluation.
const BASE = 'https://apisv2.awardtoolapi.com'

function key() {
  return process.env.AWARDTOOL_API_KEY || ''
}

async function post(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  const text = await response.text()
  let json: any = null
  try { json = text ? JSON.parse(text) : null } catch { json = null }
  return { status: response.status, json, text }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function keysOf(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value as Record<string, unknown>).sort() : []
}

function sanitizedUsageRows(json: any) {
  const rows = Array.isArray(json?.data) ? json.data : []
  return rows.slice(-3).map((row: any) => {
    const out: Record<string, unknown> = {}
    for (const [name, value] of Object.entries(row || {})) {
      if (name.toLowerCase().includes('api_key')) continue
      out[name] = value
    }
    return out
  })
}

async function main() {
  const apiKey = key()
  if (!apiKey) {
    console.log('AWARDTOOL_PROBE configured=false')
    return
  }
  console.log('AWARDTOOL_PROBE configured=true')

  const usage = await post('/api/v1/api_usage', { api_key: apiKey })
  console.log('AWARDTOOL_USAGE', JSON.stringify({
    http: usage.status,
    status: usage.json?.status ?? null,
    rows: Array.isArray(usage.json?.data) ? usage.json.data.length : 0,
    recent: sanitizedUsageRows(usage.json),
  }))

  const hotels = await post('/api/hotel_all', { api_key: apiKey })
  const hotelRows = Array.isArray(hotels.json?.data) ? hotels.json.data : []
  console.log('AWARDTOOL_HOTELS', JSON.stringify({
    http: hotels.status,
    status: hotels.json?.status ?? null,
    count: hotelRows.length,
    sample: hotelRows.slice(0, 3).map((row: any) => ({
      id: row?.id ?? null,
      name: row?.name ?? null,
      brand: row?.brand ?? null,
      points_min: row?.points_min ?? null,
      points_median: row?.points_median ?? null,
      availability_num: row?.availability_num ?? null,
    })),
  }))

  const searchDate = process.env.AWARDTOOL_PROBE_DATE || '2026-10-15'
  const trigger = await post('/flight_trigger/search_real_time', {
    origin: 'BLR',
    destination: 'SIN',
    programs: ['SQ', 'AC', 'UA', 'TK', 'BA', 'QF'],
    cabins: ['Economy', 'Premium Economy', 'Business', 'First'],
    date: searchDate,
    pax: 1,
    api_key: apiKey,
    exit_early: true,
  })
  const taskId = typeof trigger.json?.task_id === 'string' ? trigger.json.task_id : ''
  console.log('AWARDTOOL_TRIGGER', JSON.stringify({
    http: trigger.status,
    status: trigger.json?.status ?? null,
    task: Boolean(taskId),
    message: typeof trigger.json?.message === 'string' ? trigger.json.message.slice(0, 120) : null,
  }))

  if (!taskId) return

  const all: any[] = []
  const seen = new Set<string>()
  let finish = false
  let sampleShapeLogged = false
  for (let pollNo = 1; pollNo <= 8 && !finish; pollNo += 1) {
    if (pollNo > 1) await sleep(5000)
    const poll = await post('/flight_retrieval/search_result', { task_id: taskId, api_key: apiKey })
    const rows = Array.isArray(poll.json?.result) ? poll.json.result : []
    for (const row of rows) {
      const fingerprint = JSON.stringify(row)
      if (!seen.has(fingerprint)) {
        seen.add(fingerprint)
        all.push(row)
      }
    }
    finish = poll.json?.finish === true
    console.log('AWARDTOOL_POLL', JSON.stringify({
      poll: pollNo,
      http: poll.status,
      newRows: rows.length,
      uniqueRows: all.length,
      finish,
      programsDone: Array.isArray(poll.json?.program_done) ? poll.json.program_done : [],
      missingKeys: Array.isArray(poll.json?.missing_keys) ? poll.json.missing_keys : [],
      topLevelKeys: keysOf(poll.json),
    }))
    if (!sampleShapeLogged && rows[0]) {
      sampleShapeLogged = true
      const sample = rows[0]
      const nestedShapes: Record<string, string[]> = {}
      for (const [name, value] of Object.entries(sample)) {
        if (Array.isArray(value) && value[0] && typeof value[0] === 'object') nestedShapes[name] = keysOf(value[0])
        else if (value && typeof value === 'object' && !Array.isArray(value)) nestedShapes[name] = keysOf(value)
      }
      console.log('AWARDTOOL_RESULT_SHAPE', JSON.stringify({
        keys: keysOf(sample),
        nested: nestedShapes,
        known: {
          program_code: sample?.program_code ?? null,
          origin: sample?.origin ?? sample?.departure ?? null,
          destination: sample?.destination ?? sample?.arrival ?? null,
          cabin: sample?.cabin ?? sample?.cabin_class ?? null,
          miles: sample?.miles ?? sample?.points ?? sample?.mileage ?? null,
          taxes: sample?.taxes ?? sample?.tax ?? sample?.fees ?? null,
        },
      }))
    }
  }

  console.log('AWARDTOOL_REALTIME_SUMMARY', JSON.stringify({
    route: 'BLR-SIN',
    date: searchDate,
    uniqueRows: all.length,
    finish,
    programmeCounts: all.reduce((acc: Record<string, number>, row: any) => {
      const code = String(row?.program_code || 'unknown')
      acc[code] = (acc[code] || 0) + 1
      return acc
    }, {}),
  }))
}

main().catch(error => {
  console.error('AWARDTOOL_PROBE_ERROR', error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})

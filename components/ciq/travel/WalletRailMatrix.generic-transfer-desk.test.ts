import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const source = fs.readFileSync(path.join(process.cwd(), 'components/ciq/travel/WalletRailMatrix.tsx'), 'utf8')

describe('WalletRailMatrix generic transfer desk', () => {
  it('keeps all sourced loyalty transfers visible before a programme is selected', () => {
    expect(source).toContain('if (!programmeId) return true')
    expect(source).toContain("'Flight loyalty transfer desk'")
    expect(source).toContain("'Hotel loyalty transfer desk'")
    expect(source).toContain('Check points & book →')
  })

  it('still narrows transfer rails when a specific programme is selected', () => {
    expect(source).toContain('return rail.transfer?.programmeId === programmeId')
  })
})

import * as mock from '../mock/mockApi'
import * as real from './client'

// true = fake demo data, false = asli backend
const USE_MOCK = true

export const api = USE_MOCK ? mock : real
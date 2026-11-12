import { executarMigrations } from './migrate.js'
import { fecharPool } from './db.js'

try {
  await executarMigrations()
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  await fecharPool()
}

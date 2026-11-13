import { app } from './app.js'
import { env, port } from './config.js'
import { executarMigrations } from './migrate.js'

if (env.MIGRATE_ON_START === 'true') {
  await executarMigrations()
}

app.listen(port, () => console.log('Aplicação e API rodando'))

/**
 * Script pour analyser la structure des tables manquantes
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function analyzeTables() {
  try {
    const tables = ['homepage_editor', 'premium_codes', 'premium_code_usages', 'subscription_prices']

    for (const tableName of tables) {
      console.log(`\n📋 Structure de la table: ${tableName}\n`)
      
      const columns = await prisma.$queryRaw<Array<{
        column_name: string
        data_type: string
        is_nullable: string
        column_default: string | null
      }>>`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        ORDER BY ordinal_position;
      `

      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'} ${col.column_default ? `default: ${col.column_default}` : ''}`)
      })

      // Vérifier les contraintes
      const constraints = await prisma.$queryRaw<Array<{
        constraint_name: string
        constraint_type: string
      }>>`
        SELECT 
          tc.constraint_name,
          tc.constraint_type
        FROM information_schema.table_constraints tc
        WHERE tc.table_schema = 'public' 
          AND tc.table_name = ${tableName};
      `

      if (constraints.length > 0) {
        console.log(`\n  Contraintes:`)
        constraints.forEach(con => {
          console.log(`    - ${con.constraint_type}: ${con.constraint_name}`)
        })
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

analyzeTables()


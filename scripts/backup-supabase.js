// Backup semanal (agendado via Task Scheduler) dos dados do Supabase.
// Não é um dump binário igual ao pg_dump oficial (esse projeto não tem
// Docker rodando nem permissão de admin pra instalar o cliente nativo do
// Postgres) — aqui a gente conecta direto via `pg` (driver puro em JS, sem
// binário nenhum) e exporta os dados de cada tabela em JSON. O schema
// (tabelas, functions, policies) já fica versionado em supabase/migrations/,
// então o que importa proteger aqui são os DADOS.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const configPath = path.join(projectRoot, 'supabase-backup.local.json');

// Fica fora do repositório do Git (pasta irmã, não dentro de controlfretev1)
// porque os dumps têm dados reais de usuários.
const backupsRoot = path.resolve(projectRoot, '..', 'Backups-Supabase');
const RETENTION_DAYS = 56; // ~8 semanas

function loadConnectionString() {
  if (!fs.existsSync(configPath)) {
    console.error(
      `Arquivo de configuração não encontrado: ${configPath}\n` +
      'Crie esse arquivo (ele fica fora do Git, nunca é commitado) com o conteúdo:\n' +
      '{\n  "connectionString": "COLE_AQUI_A_CONNECTION_STRING_DO_SUPABASE"\n}\n' +
      'A connection string está em: Supabase Studio → Project Settings → Database → Connection string (URI).'
    );
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  if (!raw.connectionString) {
    console.error(`"connectionString" não encontrada em ${configPath}`);
    process.exit(1);
  }
  return raw.connectionString;
}

function cleanOldBackups() {
  if (!fs.existsSync(backupsRoot)) return;
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  for (const entry of fs.readdirSync(backupsRoot)) {
    const entryPath = path.join(backupsRoot, entry);
    const stat = fs.statSync(entryPath);
    if (stat.isDirectory() && stat.mtimeMs < cutoff) {
      fs.rmSync(entryPath, { recursive: true, force: true });
      console.log(`Backup antigo removido: ${entry}`);
    }
  }
}

async function main() {
  const connectionString = loadConnectionString();
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const dateStamp = new Date().toISOString().slice(0, 10);
  const outDir = path.join(backupsRoot, dateStamp);
  fs.mkdirSync(outDir, { recursive: true });

  try {
    const { rows: tables } = await client.query(`
      select table_name from information_schema.tables
      where table_schema = 'public' and table_type = 'BASE TABLE'
      order by table_name
    `);

    let totalRows = 0;
    for (const { table_name } of tables) {
      const { rows } = await client.query(`select * from "public"."${table_name}"`);
      fs.writeFileSync(
        path.join(outDir, `${table_name}.json`),
        JSON.stringify(rows, null, 2)
      );
      totalRows += rows.length;
      console.log(`  ${table_name}: ${rows.length} linhas`);
    }

    console.log(`Backup concluído em ${outDir} (${tables.length} tabelas, ${totalRows} linhas).`);
    cleanOldBackups();
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Falha no backup:', err);
  process.exit(1);
});

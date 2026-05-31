import * as dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'https://api.api-futebol.com.br/v1';
const KEY = process.env.API_FUTEBOL_KEY;
const CHAMPIONSHIP_ID = 10;

if (!KEY) {
  console.error('API_FUTEBOL_KEY is not set in .env');
  process.exit(1);
}

async function get(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
  return res.json();
}

async function main() {
  console.log('Live matches (/ao-vivo):\n');
  const live = await get('/ao-vivo') as Array<{
    partida_id: number;
    campeonato: { campeonato_id: number; nome: string };
    status: string;
    data_realizacao: string;
    hora_realizacao: string;
    placar_mandante: number | null;
    placar_visitante: number | null;
    disputa_penalti: boolean;
    placar_penaltis_mandante: number | null;
    placar_penaltis_visitante: number | null;
    time_mandante: { time_id: number; nome_popular: string; sigla: string };
    time_visitante: { time_id: number; nome_popular: string; sigla: string };
  }>;

  for (const p of live) {
    console.log(`partida_id : ${p.partida_id}`);
    console.log(`campeonato : [${p.campeonato.campeonato_id}] ${p.campeonato.nome}`);
    console.log(`match      : ${p.time_mandante.nome_popular} (${p.time_mandante.sigla}, id=${p.time_mandante.time_id}) vs ${p.time_visitante.nome_popular} (${p.time_visitante.sigla}, id=${p.time_visitante.time_id})`);
    console.log(`score      : ${p.placar_mandante ?? '-'} x ${p.placar_visitante ?? '-'}${p.disputa_penalti ? ` (pen: ${p.placar_penaltis_mandante} x ${p.placar_penaltis_visitante})` : ''}`);
    console.log(`status     : ${p.status}  |  ${p.data_realizacao} ${p.hora_realizacao}`);
    console.log();
  }
}

main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});

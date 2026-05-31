import { env } from '@/env/config';

const BASE_URL = 'https://api.api-futebol.com.br/v1';

export type ApiFutebolMatchStatus =
  | 'agendado'
  | 'ao_vivo'
  | 'intervalo'
  | 'encerrado'
  | 'cancelado'
  | 'suspenso';

export type ApiFutebolTeam = {
  time_id: number;
  nome_popular: string;
  sigla: string;
};

export type ApiFutebolMatch = {
  partida_id: number;
  campeonato: { campeonato_id: number; nome: string };
  placar: string;
  placar_mandante: number | null;
  placar_visitante: number | null;
  placar_penaltis_mandante: number | null;
  placar_penaltis_visitante: number | null;
  disputa_penalti: boolean;
  status: ApiFutebolMatchStatus;
  data_realizacao: string;     // DD/MM/YYYY
  hora_realizacao: string;     // HH:MM
  data_realizacao_iso: string; // ISO 8601
  time_mandante: ApiFutebolTeam;
  time_visitante: ApiFutebolTeam;
};

async function request<T>(path: string): Promise<T> {
  const key = env.API_FUTEBOL_KEY;
  if (!key) throw new Error('API_FUTEBOL_KEY is not set');

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });

  if (!res.ok) {
    throw new Error(`API-Futebol error ${res.status}: ${await res.text()}`);
  }

  return res.json() as Promise<T>;
}

export const apiFutebolClient = {
  getMatch: (matchId: number) =>
    request<ApiFutebolMatch>(`/partidas/${matchId}`),

  getLiveMatches: async (championshipId?: number): Promise<ApiFutebolMatch[]> => {
    const matches = await request<ApiFutebolMatch[]>('/ao-vivo');
    if (championshipId === undefined) return matches;
    return matches.filter((m) => m.campeonato.campeonato_id === championshipId);
  },
};

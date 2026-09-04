import { query } from "@/lib/db";
import { NextResponse } from "next/server";

const RETELL_API_KEY = process.env.RETELL_API_KEY!;
const RETELL_FROM_NUMBER = process.env.RETELL_FROM_NUMBER!; // +556136863530
const LOTE = 5;
const INTERVALO_RETRY_HORAS = 2;

function dentroHorarioComercial() {
  const agora = new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
  const hora = new Date(agora).getHours();
  const diaSemana = new Date(agora).getDay(); // 0=domingo
  return diaSemana >= 1 && diaSemana <= 5 && hora >= 8 && hora < 18;
}

export async function POST() {
  if (!dentroHorarioComercial()) {
    return NextResponse.json({ ok: false, motivo: "fora do horário comercial" });
  }

  const fila = await query(
    `SELECT * FROM fila_discagem
     WHERE status = 'pendente' AND proxima_tentativa <= now()
     ORDER BY criado_em ASC
     LIMIT $1`,
    [LOTE]
  );

  const resultados = [];

  for (const item of fila.rows) {
    try {
      const resp = await fetch("https://api.retellai.com/v2/create-phone-call", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RETELL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from_number: RETELL_FROM_NUMBER,
          to_number: item.telefone,
        }),
      });

      if (!resp.ok) throw new Error(await resp.text());

      await query(
        `UPDATE fila_discagem SET status = 'discando', tentativas = tentativas + 1, atualizado_em = now() WHERE id = $1`,
        [item.id]
      );
      resultados.push({ lead_id: item.lead_id, ok: true });
    } catch (e) {
      const novaTentativa = item.tentativas + 1;
      const novoStatus = novaTentativa >= item.max_tentativas ? "esgotado" : "pendente";
      await query(
        `UPDATE fila_discagem
         SET status = $1, tentativas = $2, proxima_tentativa = now() + interval '${INTERVALO_RETRY_HORAS} hours', atualizado_em = now()
         WHERE id = $3`,
        [novoStatus, novaTentativa, item.id]
      );
      resultados.push({ lead_id: item.lead_id, ok: false });
    }
  }

  return NextResponse.json({ processados: resultados.length, resultados });
}

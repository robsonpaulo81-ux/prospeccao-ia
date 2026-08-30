import { query } from "@/lib/db";

export async function POST(req: Request) {
  const { nome, mensagem, filtros } = await req.json();

  const campanha = await query(
    "INSERT INTO campanhas_sms (nome, mensagem) VALUES ($1, $2) RETURNING id",
    [nome, mensagem]
  );
  const campanhaId = campanha[0].id;

  const condicoes: string[] = [];
  const valores: any[] = [];
  let i = 1;

  if (filtros.fase) {
    condicoes.push(`fase = $${i++}`);
    valores.push(filtros.fase);
  }
  if (filtros.cidade) {
    condicoes.push(`cidade = $${i++}`);
    valores.push(filtros.cidade);
  }
  if (filtros.tipo_imovel) {
    condicoes.push(`tipo_imovel = $${i++}`);
    valores.push(filtros.tipo_imovel);
  }

  const whereClause = condicoes.length
    ? `WHERE ${condicoes.join(" AND ")} AND telefone IS NOT NULL`
    : `WHERE telefone IS NOT NULL`;

  const leads = await query(
    `SELECT id, telefone FROM leads ${whereClause}`,
    valores
  );

  for (const lead of leads) {
    await query(
      "INSERT INTO campanha_sms_destinatarios (campanha_id, lead_id, telefone) VALUES ($1, $2, $3)",
      [campanhaId, lead.id, lead.telefone]
    );
  }

  return Response.json({ ok: true, campanhaId, total: leads.length });
}

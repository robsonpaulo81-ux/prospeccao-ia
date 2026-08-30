import { query } from "@/lib/db";
import { enviarSMS } from "@/lib/twilio-sms";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const campanha = await query(
    "SELECT * FROM campanhas_sms WHERE id = $1", [params.id]
  );
  const destinatarios = await query(
    "SELECT * FROM campanha_sms_destinatarios WHERE campanha_id = $1 AND status = 'pendente'",
    [params.id]
  );

  for (const d of destinatarios) {
    try {
      await enviarSMS(d.telefone, campanha[0].mensagem);
      await query(
        "UPDATE campanha_sms_destinatarios SET status='enviado', enviado_em=now() WHERE id=$1",
        [d.id]
      );
    } catch (e: any) {
      await query(
        "UPDATE campanha_sms_destinatarios SET status='falhou', erro=$1 WHERE id=$2",
        [e.message, d.id]
      );
    }
  }

  await query("UPDATE campanhas_sms SET status='concluida' WHERE id=$1", [params.id]);
  return Response.json({ ok: true, total: destinatarios.length });
}

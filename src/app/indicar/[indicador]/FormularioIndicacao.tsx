'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

const HEADERS_JSON = { 'Content-Type': 'application/json' };

export default function FormularioIndicacao() {
  const params = useParams();
  const indicadorDaUrl = decodeURIComponent(String(params?.indicador ?? '')).replace(/-/g, ' ');

  const [form, setForm] = useState({
    indicadorNome: indicadorDaUrl,
    indicadorTelefone: '',
    leadNome: '',
    leadTelefone: '',
    interesse: 'casa',
    notas: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');
  const [arquivos, setArquivos] = useState<File[]>([]);

  function atualizarCampo(campo: string, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function enviarArquivosSeExistirem(): Promise<string[]> {
    if (arquivos.length === 0) return [];
    const urls: string[] = [];
    for (const arq of arquivos) {
      const dados = new FormData();
      dados.append('arquivo', arq);
      const resp = await fetch('/api/upload', { method: 'POST', body: dados });
      if (!resp.ok) throw new Error('Falha ao enviar o documento: ' + arq.name);
      const data = await resp.json();
      urls.push(data.url as string);
    }
    return urls;
  }

  async function enviarIndicacao(documentoUrls: string[]) {
    const corpo = JSON.stringify({ ...form, documentoUrls });
    const resp = await fetch('/api/indicacao', { method: 'POST', headers: HEADERS_JSON, body: corpo });
    return resp;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    if (!form.indicadorNome || !form.leadNome || !form.leadTelefone) {
      setErro('Preencha nome de quem indica, nome e telefone do indicado.');
      return;
    }
    setEnviando(true);
    try {
      const documentoUrls = await enviarArquivosSeExistirem();
      const resp = await enviarIndicacao(documentoUrls);
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || 'Erro ao enviar indicacao.');
      }
      setEnviado(true);
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <p style={styles.title}>Indicacao recebida!</p>
          <p style={styles.subtitle}>
            Obrigado, {form.indicadorNome}. O Robson vai entrar em contato com {form.leadNome} em breve.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <div style={styles.perfil}>
          <img src="/foto-perfil.jpg" alt="Róbson Paullo" style={styles.avatarFoto} />
          <div>
            <p style={styles.nomeCorretor}>Róbson Paullo</p>
            <p style={styles.creci}>CRECI 39673</p>
          </div>
        </div>

        <p style={styles.title}>Indique um cliente</p>

        <div style={styles.field}>
          <label style={styles.label}>Seu nome (quem indica)</label>
          <input style={styles.input} type="text" value={form.indicadorNome} onChange={(e) => atualizarCampo('indicadorNome', e.target.value)} placeholder="Maria Silva" disabled={!!indicadorDaUrl} />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Seu telefone (opcional)</label>
          <input style={styles.input} type="tel" value={form.indicadorTelefone} onChange={(e) => atualizarCampo('indicadorTelefone', e.target.value)} placeholder="(61) 99999-9999" />
        </div>

        <hr style={styles.divider} />

        <div style={styles.field}>
          <label style={styles.label}>Nome do indicado</label>
          <input style={styles.input} type="text" value={form.leadNome} onChange={(e) => atualizarCampo('leadNome', e.target.value)} placeholder="Joao Pereira" />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Telefone do indicado</label>
          <input style={styles.input} type="tel" value={form.leadTelefone} onChange={(e) => atualizarCampo('leadTelefone', e.target.value)} placeholder="(61) 99999-9999" />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Interesse</label>
          <select style={styles.input} value={form.interesse} onChange={(e) => atualizarCampo('interesse', e.target.value)}>
            <option value="casa">Casa</option>
            <option value="apartamento">Apartamento</option>
            <option value="nao_sabe">Ainda nao sabe</option>
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Observações (opcional)</label>
          <textarea
            style={{ ...styles.input, minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }}
            value={form.notas}
            onChange={(e) => atualizarCampo('notas', e.target.value)}
            placeholder="Ex: já mora na região, quer mudar até dezembro..."
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Documentos do indicado (opcional)</label>
          <input
            style={styles.input}
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={(e) => setArquivos(Array.from(e.target.files ?? []))}
          />
          {arquivos.length > 0 && (
            <p style={{ fontSize: 12, color: '#777', marginTop: 4 }}>
              {arquivos.length} arquivo(s) selecionado(s)
            </p>
          )}
        </div>

        {erro && <p style={styles.erro}>{erro}</p>}

        <button style={styles.botao} type="submit" disabled={enviando}>
          {enviando ? 'Enviando...' : 'Enviar indicacao'}
        </button>
      </form>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg)' },
  card: { width: '100%', maxWidth: 400, background: 'var(--card-bg)', borderRadius: 16, padding: '28px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
  perfil: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 },
  avatarFoto: { width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  nomeCorretor: { fontWeight: 700, fontSize: 15, margin: 0, color: 'var(--text)' },
  creci: { fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' },
  title: { fontSize: 18, fontWeight: 600, margin: '0 0 16px', color: 'var(--text)' },
  field: { marginBottom: 14 },
  label: { display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 },
  input: { width: '100%', padding: '10px 12px', fontSize: 15, border: '1px solid var(--border)', borderRadius: 8, boxSizing: 'border-box', background: 'var(--card-bg)', color: 'var(--text)' },
  divider: { border: 'none', borderTop: '1px solid var(--border)', margin: '18px 0' },
  botao: { width: '100%', marginTop: 8, padding: '12px', fontSize: 15, fontWeight: 600, color: '#fff', background: '#1a1a1a', border: 'none', borderRadius: 8, cursor: 'pointer' },
  erro: { fontSize: 13, color: '#c0392b', margin: '4px 0 12px' },
  subtitle: { fontSize: 14, color: 'var(--text-muted)', margin: '4px 0 20px', textAlign: 'center' },
};

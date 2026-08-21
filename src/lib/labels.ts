export const COLUNAS = [
  { fase: "novo", titulo: "Novo", cor: "#f1efe8", corTexto: "#2c2c2a" },
  { fase: "atendimento", titulo: "Em atendimento", cor: "#e6f1fb", corTexto: "#0c447c" },
  { fase: "interessado", titulo: "Interessado", cor: "#e1f5ee", corTexto: "#085041" },
  { fase: "hot_lead", titulo: "Hot lead", cor: "#faeeda", corTexto: "#633806" },
  { fase: "analise_cca", titulo: "Análise CCA", cor: "#ede7f6", corTexto: "#4527a0" },
  { fase: "pend_documentacao", titulo: "Pend. Documentação", cor: "#e8eaf6", corTexto: "#303f9f" },
  { fase: "aprovado", titulo: "Aprovado", cor: "#a5d6a7", corTexto: "#1b5e20" },
  { fase: "condicionado", titulo: "Condicionado", cor: "#ffe082", corTexto: "#7a4a00" },
  { fase: "reprovado", titulo: "Reprovado", cor: "#212121", corTexto: "#f5f5f5" },
  { fase: "restricao", titulo: "Tem restrição", cor: "#fcebeb", corTexto: "#791f1f" },
  { fase: "interesse_futuro", titulo: "Interesse Futuro", cor: "#fff3e0", corTexto: "#8a5a00" },
  { fase: "sem_interesse", titulo: "Sem interesse", cor: "#f1efe8", corTexto: "#5f5e5a" },
];

export const FASE_LABEL: Record<string, string> = Object.fromEntries(COLUNAS.map((c) => [c.fase, c.titulo]));

export const IMOVEL_LABEL: Record<string, string> = { casa: "Casa", apartamento: "Apê" };

export const CIDADE_LABEL: Record<string, string> = { aguas_lindas: "Águas Lindas", brasilia: "Brasília" };

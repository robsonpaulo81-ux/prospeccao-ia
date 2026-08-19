'use client';

function formatarCentavos(centavosTexto: string) {
  const numero = Number(centavosTexto || '0') / 100;
  return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CampoMoeda({
  valorCentavos,
  onChange,
  placeholder,
  style,
}: {
  valorCentavos: string;
  onChange: (novoValorCentavos: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={valorCentavos ? formatarCentavos(valorCentavos) : ''}
      onChange={(e) => {
        const apenasDigitos = e.target.value.replace(/\D/g, '');
        onChange(apenasDigitos);
      }}
      style={style}
    />
  );
}

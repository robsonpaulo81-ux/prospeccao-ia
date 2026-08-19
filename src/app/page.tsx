-- Apaga primeiro os leads de teste (pelo nome do lead)
DELETE FROM leads
WHERE nome ILIKE '%teste%'
   OR nome ILIKE 'maria c%'
   OR nome ILIKE 'raquel santos%'
   OR nome ILIKE 'joao%';

-- Apaga os indicadores de teste (identificados pelos nomes usados hoje)
DELETE FROM indicadores
WHERE nome ILIKE '%teste%'
   OR nome ILIKE 'sione'
   OR nome ILIKE 'lima'
   OR nome ILIKE 'daniel'
   OR nome ILIKE 'maria silva'
   OR nome ILIKE 'joao'
   OR nome ILIKE 'róbaon paullo';

-- Remove indicadores que ficaram sem nenhum lead (órfãos)
DELETE FROM indicadores
WHERE id NOT IN (
  SELECT DISTINCT indicado_por FROM leads WHERE indicado_por IS NOT NULL
);

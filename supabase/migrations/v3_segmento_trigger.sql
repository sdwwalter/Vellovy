-- supabase/migrations/v3_segmento_trigger.sql
-- Recalcula segmento do cliente automaticamente após inserção no caixa.
-- Isso garante que o CRM esteja sempre atualizado sem depender do front-end.

CREATE OR REPLACE FUNCTION recalcular_segmento_cliente()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualiza contadores do cliente correspondente
  UPDATE clientes
  SET
    total_visitas = total_visitas + 1,
    ultima_visita = NEW.data,
    total_gasto   = total_gasto + NEW.valor,
    -- Recalcula segmento inline
    segmento = CASE
      WHEN total_visitas + 1 >= 10 THEN 'fiel'
      WHEN total_visitas + 1 >= 1 THEN 'regular'
      ELSE 'nova'
    END
  WHERE salao_id = NEW.salao_id
    AND nome = NEW.cliente_nome
    -- Só atualiza se encontrar match exato pelo nome
    AND id = (
      SELECT id FROM clientes
      WHERE salao_id = NEW.salao_id
        AND nome = NEW.cliente_nome
      LIMIT 1
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: dispara após cada lançamento no caixa
CREATE TRIGGER trg_segmento_apos_caixa
  AFTER INSERT ON lancamentos_caixa
  FOR EACH ROW
  EXECUTE FUNCTION recalcular_segmento_cliente();

-- Função para recalcular segmento de TODOS os clientes (batch job mensal)
CREATE OR REPLACE FUNCTION recalcular_todos_segmentos(p_salao_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE clientes
  SET segmento = CASE
    WHEN total_visitas = 0 OR ultima_visita IS NULL THEN 'nova'
    WHEN EXTRACT(DAY FROM now() - ultima_visita::timestamp) > 90 THEN 'inativa'
    WHEN EXTRACT(DAY FROM now() - ultima_visita::timestamp) > 45 THEN 'ausente'
    WHEN total_visitas >= 10 THEN 'fiel'
    ELSE 'regular'
  END
  WHERE salao_id = p_salao_id;
END;
$$ LANGUAGE plpgsql;

/**
 * Rotas — Métricas e Dashboard
 * GET /api/v1/metricas/dashboard — métricas de sustentabilidade da empresa
 * GET /api/v1/metricas/relatorio — dados detalhados para relatórios
 */

import type { FastifyPluginAsync } from "fastify";
import { FATORES_IMPACTO } from "@ecotrack/shared";

export const metricasRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("onRequest", fastify.authenticate);

  // ─── GET /dashboard ─────────────────────────────────────────────────────────
  fastify.get(
    "/dashboard",
    {
      schema: {
        tags: ["metricas"],
        summary: "Métricas de sustentabilidade para o dashboard",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            periodo: {
              type: "string",
              enum: ["7d", "30d", "90d", "12m"],
              default: "30d",
            },
          },
        },
      },
    },
    async (req, reply) => {
      const { empresaId } = req.user;
      const { periodo } = req.query as { periodo?: string };

      const agora = new Date();
      const inicio = new Date();
      switch (periodo ?? "30d") {
        case "7d":
          inicio.setDate(agora.getDate() - 7);
          break;
        case "90d":
          inicio.setDate(agora.getDate() - 90);
          break;
        case "12m":
          inicio.setFullYear(agora.getFullYear() - 1);
          break;
        default:
          inicio.setDate(agora.getDate() - 30);
      }

      // Coletas no período
      const coletas = await fastify.prisma.coleta.findMany({
        where: {
          empresaId,
          criadoEm: { gte: inicio },
        },
        select: {
          id: true,
          status: true,
          pesoRealKg: true,
          dataAgendada: true,
          dataRealizada: true,
          residuos: {
            select: {
              quantidadeEstimada: true,
              quantidadeReal: true,
              unidade: true,
              residuo: {
                select: { tipo: true, descricao: true },
              },
            },
          },
        },
      });

      // Período anterior (para calcular tendência)
      const duracaoMs = agora.getTime() - inicio.getTime();
      const inicioAnterior = new Date(inicio.getTime() - duracaoMs);

      const coletasAnterior = await fastify.prisma.coleta.findMany({
        where: {
          empresaId,
          criadoEm: { gte: inicioAnterior, lt: inicio },
        },
        select: { id: true, status: true, pesoRealKg: true },
      });

      // Calcular métricas
      const finalizadas = coletas.filter(
        (c) => c.status === "COLETADO" || c.status === "FINALIZADO"
      );
      const finalizadasAnterior = coletasAnterior.filter(
        (c) => c.status === "COLETADO" || c.status === "FINALIZADO"
      );

      const totalPesoKg = finalizadas.reduce((acc, c) => acc + (c.pesoRealKg ?? 0), 0);
      const totalPesoAnterior = finalizadasAnterior.reduce(
        (acc, c) => acc + (c.pesoRealKg ?? 0),
        0
      );

      const co2Evitado = totalPesoKg * FATORES_IMPACTO.CO2_POR_KG_RECICLAVEL;
      const aguaEconomizada = totalPesoKg * FATORES_IMPACTO.AGUA_POR_KG_RECICLAVEL;

      // Por tipo de resíduo
      const porTipo: Record<string, { quantidade: number; pesoKg: number }> = {};
      for (const coleta of finalizadas) {
        for (const r of coleta.residuos) {
          const tipo = r.residuo.tipo;
          if (!porTipo[tipo]) porTipo[tipo] = { quantidade: 0, pesoKg: 0 };
          porTipo[tipo].quantidade += r.quantidadeReal ?? r.quantidadeEstimada;
          porTipo[tipo].pesoKg += r.quantidadeReal ?? r.quantidadeEstimada;
        }
      }

      // Por status
      const porStatus: Record<string, number> = {};
      for (const c of coletas) {
        porStatus[c.status] = (porStatus[c.status] ?? 0) + 1;
      }

      // MTRs
      const mtrs = await fastify.prisma.manifestoMTR.count({
        where: {
          coleta: { empresaId },
          status: { not: "RASCUNHO" },
          criadoEm: { gte: inicio },
        },
      });

      // Tendências (% de variação)
      function tendencia(atual: number, anterior: number) {
        if (anterior === 0) return { valor: atual > 0 ? 100 : 0, tipo: "positivo" as const };
        const pct = Math.round(((atual - anterior) / anterior) * 100);
        return {
          valor: Math.abs(pct),
          tipo: pct >= 0 ? ("positivo" as const) : ("negativo" as const),
        };
      }

      // Coletas por dia (para gráfico de linha)
      const coletasPorDia: Record<string, number> = {};
      for (const c of coletas) {
        const dia = new Date(c.dataAgendada).toISOString().slice(0, 10);
        coletasPorDia[dia] = (coletasPorDia[dia] ?? 0) + 1;
      }

      return reply.status(200).send({
        success: true,
        data: {
          periodo: { inicio: inicio.toISOString(), fim: agora.toISOString() },
          resumo: {
            totalColetas: coletas.length,
            coletasRealizadas: finalizadas.length,
            totalPesoKg: Math.round(totalPesoKg * 10) / 10,
            co2EvitadoKg: Math.round(co2Evitado * 10) / 10,
            aguaEconomizadaLitros: Math.round(aguaEconomizada * 10) / 10,
            arvoresEquivalentes: Math.round(co2Evitado / 22),
            mtrsEmitidos: mtrs,
          },
          tendencias: {
            peso: tendencia(totalPesoKg, totalPesoAnterior),
            coletas: tendencia(finalizadas.length, finalizadasAnterior.length),
          },
          porTipo,
          porStatus,
          coletasPorDia: Object.entries(coletasPorDia)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([dia, total]) => ({ dia, total })),
        },
      });
    }
  );

  // ─── GET /relatorio ─────────────────────────────────────────────────────────
  fastify.get(
    "/relatorio",
    {
      schema: {
        tags: ["metricas"],
        summary: "Dados detalhados para relatório exportável",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            dataInicio: { type: "string", format: "date" },
            dataFim: { type: "string", format: "date" },
          },
        },
      },
    },
    async (req, reply) => {
      const { empresaId } = req.user;
      const { dataInicio, dataFim } = req.query as {
        dataInicio?: string;
        dataFim?: string;
      };

      const inicio = dataInicio ? new Date(dataInicio) : new Date(Date.now() - 30 * 86400000);
      const fim = dataFim ? new Date(dataFim) : new Date();
      fim.setHours(23, 59, 59, 999);

      const coletas = await fastify.prisma.coleta.findMany({
        where: {
          empresaId,
          criadoEm: { gte: inicio, lte: fim },
        },
        include: {
          residuos: {
            include: { residuo: { select: { tipo: true, descricao: true } } },
          },
          manifesto: {
            select: { id: true, numeroSinir: true, status: true },
          },
        },
        orderBy: { dataAgendada: "asc" },
      });

      // Formatar para export
      const linhas = coletas.map((c) => ({
        id: c.id,
        dataAgendada: c.dataAgendada,
        dataRealizada: c.dataRealizada,
        status: c.status,
        endereco: `${c.logradouro}, ${c.numero} - ${c.bairro}, ${c.cidade}/${c.estado}`,
        pesoRealKg: c.pesoRealKg,
        residuos: c.residuos.map((r) => ({
          tipo: r.residuo.tipo,
          descricao: r.residuo.descricao,
          quantidadeEstimada: r.quantidadeEstimada,
          quantidadeReal: r.quantidadeReal,
          unidade: r.unidade,
        })),
        mtr: c.manifesto
          ? { numero: c.manifesto.numeroSinir, status: c.manifesto.status }
          : null,
      }));

      const totalPesoKg = coletas.reduce((acc, c) => acc + (c.pesoRealKg ?? 0), 0);

      return reply.status(200).send({
        success: true,
        data: {
          periodo: { inicio: inicio.toISOString(), fim: fim.toISOString() },
          totalColetas: coletas.length,
          totalPesoKg: Math.round(totalPesoKg * 10) / 10,
          co2EvitadoKg: Math.round(totalPesoKg * FATORES_IMPACTO.CO2_POR_KG_RECICLAVEL * 10) / 10,
          linhas,
        },
      });
    }
  );
};

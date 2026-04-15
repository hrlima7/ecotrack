/**
 * Servico de Notificacoes — disparo de emails transacionais EcoTrack
 * Templates HTML simples (inline styles) — compativel com clientes de email.
 */

import type { FastifyInstance } from "fastify";
import { STATUS_COLETA_LABELS } from "@ecotrack/shared";

type StatusColetaStr = keyof typeof STATUS_COLETA_LABELS;

interface ColetaParaEmail {
  id: string;
  status: StatusColetaStr;
  dataAgendada: Date;
  cidade: string;
  estado: string;
  empresa: { razaoSocial: string };
}

const PRIMARY = "#16A34A";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";

function shell(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${TEXT};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid ${BORDER};border-radius:12px;max-width:560px;">
        <tr><td style="padding:24px 32px;border-bottom:1px solid ${BORDER};">
          <div style="font-size:18px;font-weight:700;color:${PRIMARY};">EcoTrack</div>
          <div style="font-size:12px;color:${MUTED};margin-top:2px;">Gestao de residuos sustentavel</div>
        </td></tr>
        <tr><td style="padding:32px;">${content}</td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid ${BORDER};text-align:center;font-size:11px;color:${MUTED};">
          Voce esta recebendo este email pois possui uma conta na EcoTrack.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function botaoCta(texto: string, url: string): string {
  return `<div style="margin:24px 0;"><a href="${url}" style="display:inline-block;background:${PRIMARY};color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">${texto}</a></div>`;
}

function p(texto: string): string {
  return `<p style="font-size:14px;line-height:1.6;color:${TEXT};margin:0 0 12px 0;">${texto}</p>`;
}

function h1(texto: string): string {
  return `<h1 style="font-size:20px;font-weight:700;color:${TEXT};margin:0 0 16px 0;">${texto}</h1>`;
}

// ─── Templates ──────────────────────────────────────────────────────────────

export function templateBoasVindas(nome: string, empresa: string, loginUrl: string): string {
  return shell(
    h1(`Bem-vindo a EcoTrack, ${nome}!`) +
      p(`A empresa <strong>${empresa}</strong> foi cadastrada com sucesso.`) +
      p("Voce ja pode agendar coletas, emitir manifestos MTR e acompanhar o impacto ambiental da sua operacao.") +
      botaoCta("Acessar a plataforma", loginUrl)
  );
}

export function templateColetaCriada(coleta: ColetaParaEmail, url: string): string {
  const data = coleta.dataAgendada.toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" });
  return shell(
    h1("Coleta agendada com sucesso") +
      p(`Sua coleta foi registrada para <strong>${data}</strong> em ${coleta.cidade}/${coleta.estado}.`) +
      p(`Codigo: <code>${coleta.id.slice(0, 8)}</code> · Status: <strong>${STATUS_COLETA_LABELS.PENDENTE}</strong>`) +
      botaoCta("Ver detalhes da coleta", url)
  );
}

export function templateMudancaStatus(coleta: ColetaParaEmail, statusAnterior: StatusColeta, url: string): string {
  return shell(
    h1(`Status atualizado: ${STATUS_COLETA_LABELS[coleta.status]}`) +
      p(`A coleta em ${coleta.cidade}/${coleta.estado} mudou de <strong>${STATUS_COLETA_LABELS[statusAnterior]}</strong> para <strong>${STATUS_COLETA_LABELS[coleta.status]}</strong>.`) +
      botaoCta("Ver coleta", url)
  );
}

export function templateMtrEmitido(numero: string, empresa: string, url: string): string {
  return shell(
    h1("Manifesto MTR emitido") +
      p(`O MTR <strong>${numero}</strong> foi emitido para <strong>${empresa}</strong>.`) +
      p("Voce pode baixar o PDF e enviar para o destinador a qualquer momento.") +
      botaoCta("Baixar MTR", url)
  );
}

export function templateSenhaAlterada(nome: string): string {
  return shell(
    h1("Sua senha foi alterada") +
      p(`Ola ${nome}, sua senha de acesso a EcoTrack foi alterada com sucesso.`) +
      p("Se voce nao reconhece esta acao, entre em contato com o administrador da sua empresa imediatamente.")
  );
}

// ─── Servico ────────────────────────────────────────────────────────────────

interface NotificacaoServico {
  boasVindas: (to: string, nome: string, empresa: string) => Promise<void>;
  coletaCriada: (to: string, coleta: ColetaParaEmail) => Promise<void>;
  mudancaStatus: (to: string, coleta: ColetaParaEmail, anterior: StatusColeta) => Promise<void>;
  mtrEmitido: (to: string, numero: string, empresa: string, mtrId: string) => Promise<void>;
  senhaAlterada: (to: string, nome: string) => Promise<void>;
}

export function criarNotificacoes(fastify: FastifyInstance): NotificacaoServico {
  const baseUrl = process.env.WEB_BASE_URL ?? "http://localhost:3000";

  return {
    boasVindas: async (to, nome, empresa) => {
      await fastify.mailer.send({
        to,
        subject: "Bem-vindo a EcoTrack",
        html: templateBoasVindas(nome, empresa, `${baseUrl}/login`),
      });
    },
    coletaCriada: async (to, coleta) => {
      await fastify.mailer.send({
        to,
        subject: `Coleta agendada — ${coleta.cidade}/${coleta.estado}`,
        html: templateColetaCriada(coleta, `${baseUrl}/coletas`),
      });
    },
    mudancaStatus: async (to, coleta, anterior) => {
      await fastify.mailer.send({
        to,
        subject: `Coleta ${STATUS_COLETA_LABELS[coleta.status].toLowerCase()}`,
        html: templateMudancaStatus(coleta, anterior, `${baseUrl}/coletas`),
      });
    },
    mtrEmitido: async (to, numero, empresa, mtrId) => {
      await fastify.mailer.send({
        to,
        subject: `MTR ${numero} emitido`,
        html: templateMtrEmitido(numero, empresa, `${baseUrl}/manifesto?mtr=${mtrId}`),
      });
    },
    senhaAlterada: async (to, nome) => {
      await fastify.mailer.send({
        to,
        subject: "Senha alterada — EcoTrack",
        html: templateSenhaAlterada(nome),
      });
    },
  };
}

/**
 * Plugin Fastify — Mailer (Nodemailer)
 * Em DEV (sem SMTP_HOST): usa transporte JSON e loga no console.
 * Em PROD: usa SMTP via variaveis SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS.
 */

import fp from "fastify-plugin";
import nodemailer from "nodemailer";
import type { FastifyPluginAsync } from "fastify";
import type { Transporter } from "nodemailer";

interface SendOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

declare module "fastify" {
  interface FastifyInstance {
    mailer: {
      send: (opts: SendOptions) => Promise<void>;
      isDev: boolean;
    };
  }
}

const mailerPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? "EcoTrack <no-reply@ecotrack.app>";

  const isDev = !host;
  let transporter: Transporter;

  if (isDev) {
    transporter = nodemailer.createTransport({ jsonTransport: true });
    fastify.log.warn("Mailer em modo DEV (jsonTransport) — emails serao logados, nao enviados");
  } else {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });

    try {
      await transporter.verify();
      fastify.log.info({ host, port }, "SMTP conectado");
    } catch (err) {
      fastify.log.error({ err }, "Falha ao conectar SMTP — emails nao serao enviados");
    }
  }

  fastify.decorate("mailer", {
    isDev,
    send: async ({ to, subject, html, text }: SendOptions) => {
      try {
        const info = await transporter.sendMail({ from, to, subject, html, text });
        if (isDev) {
          fastify.log.info({ to, subject, preview: info.message?.toString().slice(0, 200) }, "Email simulado");
        } else {
          fastify.log.info({ to, subject, messageId: info.messageId }, "Email enviado");
        }
      } catch (err) {
        fastify.log.error({ err, to, subject }, "Falha ao enviar email");
      }
    },
  });
});

export { mailerPlugin };

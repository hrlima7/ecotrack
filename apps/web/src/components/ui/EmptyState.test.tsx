import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renderiza titulo e descricao", () => {
    render(<EmptyState titulo="Sem coletas" descricao="Agende a primeira" />);
    expect(screen.getByText("Sem coletas")).toBeInTheDocument();
    expect(screen.getByText("Agende a primeira")).toBeInTheDocument();
  });

  it("renderiza icone padrao quando nao informado", () => {
    render(<EmptyState titulo="Vazio" />);
    expect(screen.getByText("📭")).toBeInTheDocument();
  });

  it("renderiza icone customizado", () => {
    render(<EmptyState icone="🌱" titulo="Sem dados" />);
    expect(screen.getByText("🌱")).toBeInTheDocument();
  });

  it("renderiza CTA como link quando href fornecido", () => {
    render(
      <EmptyState
        titulo="Sem coletas"
        acao={{ label: "Agendar", href: "/agendar" }}
      />
    );
    const link = screen.getByRole("link", { name: "Agendar" });
    expect(link).toHaveAttribute("href", "/agendar");
  });

  it("renderiza CTA como botao e dispara onClick", async () => {
    const onClick = vi.fn();
    render(<EmptyState titulo="X" acao={{ label: "Acao", onClick }} />);
    await userEvent.click(screen.getByRole("button", { name: "Acao" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("nao renderiza CTA quando acao nao informada", () => {
    render(<EmptyState titulo="Sem CTA" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("aplica aria-label do titulo no container", () => {
    render(<EmptyState titulo="Sem registros" />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Sem registros");
  });
});

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MetricCard, MetricCardSkeleton } from "./MetricCard";

describe("MetricCard", () => {
  it("renderiza titulo, valor e descricao", () => {
    render(<MetricCard titulo="Coletas" valor="42" descricao="Ultimo mes" />);
    expect(screen.getByText("Coletas")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Ultimo mes")).toBeInTheDocument();
  });

  it("renderiza valor numerico ou string", () => {
    const { rerender } = render(<MetricCard titulo="A" valor={100} />);
    expect(screen.getByText("100")).toBeInTheDocument();
    rerender(<MetricCard titulo="A" valor="100 kg" />);
    expect(screen.getByText("100 kg")).toBeInTheDocument();
  });

  it("oculta tendencia quando valor=0", () => {
    render(
      <MetricCard titulo="Sem tendencia" valor="10" tendencia={{ valor: 0, tipo: "neutro" }} />
    );
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("renderiza seta de alta para tendencia positiva", () => {
    render(<MetricCard titulo="Crescimento" valor="50" tendencia={{ valor: 12, tipo: "alta" }} />);
    expect(screen.getByText("12%")).toBeInTheDocument();
    const aria = screen.getByLabelText(/Tendencia: alta de 12%/);
    expect(aria).toBeInTheDocument();
  });

  it("renderiza seta de baixa para tendencia negativa", () => {
    render(<MetricCard titulo="Queda" valor="30" tendencia={{ valor: -8, tipo: "baixa" }} />);
    expect(screen.getByText("8%")).toBeInTheDocument();
    expect(screen.getByLabelText(/Tendencia: queda de 8%/)).toBeInTheDocument();
  });

  it("aplica aria-label de metrica", () => {
    render(<MetricCard titulo="CO2 evitado" valor="100 kg" />);
    expect(screen.getByLabelText("Metrica: CO2 evitado")).toBeInTheDocument();
  });
});

describe("MetricCardSkeleton", () => {
  it("renderiza skeletons aria-hidden", () => {
    const { container } = render(<MetricCardSkeleton />);
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll(".skeleton").length).toBe(3);
  });
});

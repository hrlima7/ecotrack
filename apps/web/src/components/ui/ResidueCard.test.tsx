import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ResidueCard, ResidueTag } from "./ResidueCard";
import { RESIDUO_LABELS } from "@ecotrack/shared";

describe("ResidueCard", () => {
  it("usa label padrao do tipo quando label nao informado", () => {
    render(<ResidueCard tipo="ORGANICO" />);
    expect(screen.getByText(RESIDUO_LABELS.ORGANICO)).toBeInTheDocument();
  });

  it("sobrescreve label quando informado", () => {
    render(<ResidueCard tipo="RECICLAVEL" label="Custom Label" />);
    expect(screen.getByText("Custom Label")).toBeInTheDocument();
    expect(screen.queryByText(RESIDUO_LABELS.RECICLAVEL)).not.toBeInTheDocument();
  });

  it("renderiza descricao quando fornecida", () => {
    render(<ResidueCard tipo="ELETRONICO" descricao="Pilhas e baterias" />);
    expect(screen.getByText("Pilhas e baterias")).toBeInTheDocument();
  });

  it("aplica aria-label com tipo de residuo", () => {
    render(<ResidueCard tipo="HOSPITALAR" />);
    expect(
      screen.getByLabelText(`Tipo de residuo: ${RESIDUO_LABELS.HOSPITALAR}`)
    ).toBeInTheDocument();
  });

  it("renderiza todos os tipos sem erro", () => {
    const tipos = ["ORGANICO", "RECICLAVEL", "ELETRONICO", "HOSPITALAR", "PERIGOSO"] as const;
    tipos.forEach((t) => {
      const { unmount } = render(<ResidueCard tipo={t} />);
      expect(screen.getByText(RESIDUO_LABELS[t])).toBeInTheDocument();
      unmount();
    });
  });
});

describe("ResidueTag", () => {
  it("renderiza label do tipo", () => {
    render(<ResidueTag tipo="PERIGOSO" />);
    expect(screen.getByText(RESIDUO_LABELS.PERIGOSO)).toBeInTheDocument();
  });

  it("aplica aria-label com prefixo Tipo", () => {
    render(<ResidueTag tipo="ORGANICO" />);
    expect(screen.getByLabelText(`Tipo: ${RESIDUO_LABELS.ORGANICO}`)).toBeInTheDocument();
  });
});

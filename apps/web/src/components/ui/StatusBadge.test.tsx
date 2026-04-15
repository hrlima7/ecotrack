import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusBadge, StatusBadgeSkeleton } from "./StatusBadge";
import { STATUS_COLETA_LABELS } from "@ecotrack/shared";

describe("StatusBadge", () => {
  it("renderiza label do status PENDENTE", () => {
    render(<StatusBadge status="PENDENTE" />);
    expect(screen.getByText(STATUS_COLETA_LABELS.PENDENTE)).toBeInTheDocument();
  });

  it("renderiza label do status FINALIZADO", () => {
    render(<StatusBadge status="FINALIZADO" />);
    expect(screen.getByText(STATUS_COLETA_LABELS.FINALIZADO)).toBeInTheDocument();
  });

  it("aplica role=status com aria-label acessivel", () => {
    render(<StatusBadge status="EM_ROTA" />);
    const badge = screen.getByRole("status");
    expect(badge).toHaveAttribute("aria-label", `Status: ${STATUS_COLETA_LABELS.EM_ROTA}`);
  });

  it("aplica className customizada", () => {
    render(<StatusBadge status="CONFIRMADA" className="custom-class" />);
    expect(screen.getByRole("status")).toHaveClass("custom-class");
  });

  it("renderiza todos os status validos sem erro", () => {
    const statuses = ["PENDENTE", "CONFIRMADA", "EM_ROTA", "COLETADO", "FINALIZADO", "CANCELADO"] as const;
    statuses.forEach((s) => {
      const { unmount } = render(<StatusBadge status={s} />);
      expect(screen.getByText(STATUS_COLETA_LABELS[s])).toBeInTheDocument();
      unmount();
    });
  });
});

describe("StatusBadgeSkeleton", () => {
  it("renderiza placeholders skeleton", () => {
    const { container } = render(<StatusBadgeSkeleton />);
    expect(container.querySelectorAll(".skeleton").length).toBeGreaterThan(0);
  });
});

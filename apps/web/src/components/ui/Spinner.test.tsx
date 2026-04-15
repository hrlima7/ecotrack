import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Spinner } from "./Spinner";

describe("Spinner", () => {
  it("renderiza com role status e aria-label", () => {
    render(<Spinner />);
    const svg = screen.getByRole("status", { name: "Carregando" });
    expect(svg).toBeInTheDocument();
  });

  it("usa tamanho sm por padrao (16px)", () => {
    render(<Spinner />);
    const svg = screen.getByRole("status");
    expect(svg).toHaveAttribute("width", "16");
    expect(svg).toHaveAttribute("height", "16");
  });

  it("aplica tamanho md (20px)", () => {
    render(<Spinner size="md" />);
    const svg = screen.getByRole("status");
    expect(svg).toHaveAttribute("width", "20");
  });

  it("aplica className adicional", () => {
    render(<Spinner className="text-white" />);
    const svg = screen.getByRole("status");
    expect(svg).toHaveClass("animate-spin", "text-white");
  });
});

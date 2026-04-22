import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";

// Stub out heavy deps that don't work in jsdom
jest.mock("vexflow", () => ({ Flow: {} }), { virtual: true });
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
  Toaster: () => null,
}));

import LandingPage from "../pages/LandingPage";
import AuthPage from "../pages/AuthPage";
import Navbar from "../components/Navbar";
import ChordList from "../components/ChordList";
import ScoreRing from "../components/ScoreRing";

// ── LandingPage ───────────────────────────────────────────────────────────────

describe("LandingPage", () => {
  it("renders the app name", () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>);
    const logos = screen.getAllByText("MusicLens");
    expect(logos.length).toBeGreaterThanOrEqual(1);
  });

  it("shows hero headline", () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>);
    expect(screen.getByText(/Understand your music/i)).toBeInTheDocument();
  });

  it("shows Get started link", () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>);
    expect(screen.getByRole("link", { name: /get started free/i })).toBeInTheDocument();
  });

  it("shows all 7 supported instruments", () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>);
    ["Piano", "Keyboard", "Lead Guitar", "Bass Guitar", "Alto Saxophone", "Tenor Saxophone", "Trumpet"].forEach((instr) => {
      expect(screen.getByText(instr)).toBeInTheDocument();
    });
  });

  it("shows 6 feature cards", () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>);
    const features = ["Note Detection", "Chord Recognition", "Key & Scale", "Performance Score", "Sheet Music & Tabs", "Fast Analysis"];
    features.forEach((f) => expect(screen.getByText(f)).toBeInTheDocument());
  });
});

// ── AuthPage ──────────────────────────────────────────────────────────────────

describe("AuthPage - login mode", () => {
  it("renders Sign in heading", () => {
    render(<MemoryRouter><AuthPage mode="login" /></MemoryRouter>);
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
  });

  it("shows email and password inputs", () => {
    render(<MemoryRouter><AuthPage mode="login" /></MemoryRouter>);
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  it("shows Sign in button", () => {
    render(<MemoryRouter><AuthPage mode="login" /></MemoryRouter>);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows link to sign up", () => {
    render(<MemoryRouter><AuthPage mode="login" /></MemoryRouter>);
    expect(screen.getByRole("link", { name: /sign up free/i })).toBeInTheDocument();
  });
});

describe("AuthPage - register mode", () => {
  it("renders Create account heading", () => {
    render(<MemoryRouter><AuthPage mode="register" /></MemoryRouter>);
    expect(screen.getByText("Create your account")).toBeInTheDocument();
  });

  it("shows Create account button", () => {
    render(<MemoryRouter><AuthPage mode="register" /></MemoryRouter>);
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });
});

// ── ChordList ─────────────────────────────────────────────────────────────────

describe("ChordList", () => {
  it("renders chord names as badges", () => {
    render(<ChordList chords={["Cmaj", "Amin", "F", "G"]} />);
    expect(screen.getByText("Cmaj")).toBeInTheDocument();
    expect(screen.getByText("Amin")).toBeInTheDocument();
    expect(screen.getByText("G")).toBeInTheDocument();
  });

  it("shows empty message when no chords", () => {
    render(<ChordList chords={[]} />);
    expect(screen.getByText(/no chords detected/i)).toBeInTheDocument();
  });
});

// ── ScoreRing ─────────────────────────────────────────────────────────────────

describe("ScoreRing", () => {
  it("renders SVG element", () => {
    const { container } = render(<ScoreRing score={85} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("shows the score value", () => {
    render(<ScoreRing score={72} />);
    // Score starts at 0 and animates, check for the /100 label
    expect(screen.getByText("/100")).toBeInTheDocument();
  });
});

// ── Navbar ────────────────────────────────────────────────────────────────────

describe("Navbar", () => {
  beforeEach(() => {
    // Seed localStorage so Navbar thinks the user is logged in
    localStorage.setItem("ml_token", "fake.token.here");
    localStorage.setItem("ml_user", JSON.stringify({ id: 1, email: "test@test.com" }));
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("shows MusicLens brand", () => {
    render(<MemoryRouter><Navbar /></MemoryRouter>);
    expect(screen.getByText("MusicLens")).toBeInTheDocument();
  });

  it("renders nav links", () => {
    render(<MemoryRouter><Navbar /></MemoryRouter>);
    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /upload/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /history/i })).toBeInTheDocument();
  });

  it("shows logout button", () => {
    render(<MemoryRouter><Navbar /></MemoryRouter>);
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });
});

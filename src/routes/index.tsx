import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BreachApp } from "@/components/echo/breach-app";
import { GameApp } from "@/components/echo/game-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [archiv, setArchiv] = useState(false);
  if (archiv) return <GameApp onBasis={() => setArchiv(false)} />;
  return <BreachApp onArchiv={() => setArchiv(true)} />;
}
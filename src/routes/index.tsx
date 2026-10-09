import { createFileRoute } from "@tanstack/react-router";
import { SliceApp } from "@/components/slice/slice-app";
import "@/components/slice/slice.css";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <SliceApp />;
}
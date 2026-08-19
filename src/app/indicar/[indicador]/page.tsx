import type { Metadata } from "next";
import FormularioIndicacao from "./FormularioIndicacao";

export const metadata: Metadata = {
  title: "Róbson Paullo - Indique um cliente",
  description: "CRECI 39673 · Corretor de imóveis. Indique um cliente pelo link e acompanhe o andamento.",
  openGraph: {
    title: "Róbson Paullo - Indique um cliente",
    description: "CRECI 39673 · Corretor de imóveis",
    images: ["/foto-perfil.jpg"],
  },
};

export default function Page() {
  return <FormularioIndicacao />;
}

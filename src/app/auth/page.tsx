import { redirect } from "next/navigation";

// Compatibilidade com o endereço usado pelo deployment antigo.
// A tela oficial de autenticação do app fica em /login.
export default function AuthPage() {
  redirect("/login");
}

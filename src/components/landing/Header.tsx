import Image from "next/image";
import logo from "@/assets/logo-tres65.png";
import { container } from "@/components/ui";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-borde/70 bg-white/90 backdrop-blur-md">
      <div className={`${container} flex h-16 items-center justify-between gap-4`}>
        <a href="#inicio" aria-label="TRES65 Inmobiliaria, ir al inicio" className="shrink-0">
          <Image src={logo} alt="TRES65 Inmobiliaria" className="h-9 w-auto sm:h-10" priority />
        </a>
        <nav aria-label="Secciones" className="hidden items-center gap-7 text-sm font-medium text-suave md:flex">
          <a className="hover:text-profundo" href="#nosotros">Nosotros</a>
          <a className="hover:text-profundo" href="#merida">Mérida</a>
          <a className="hover:text-profundo" href="#por-que-tres65">Por qué TRES65</a>
          <a className="hover:text-profundo" href="#contacto">Contacto</a>
        </nav>
        <a
          href="#cuestionario"
          className="inline-flex min-h-10 items-center rounded-full bg-profundo px-4 text-sm font-semibold text-white transition hover:bg-medio"
        >
          Cuestionario
        </a>
      </div>
    </header>
  );
}

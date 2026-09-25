import Image from "next/image";
import { ArrowDown, Clock3 } from "lucide-react";
import hero from "@/assets/hero-merida.jpg";
import { btn, container } from "@/components/ui";

export function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden bg-piedra">
      <div className={`${container} grid items-center gap-10 pb-14 pt-10 md:grid-cols-[1.1fr_0.9fr] md:gap-14 md:pb-24 md:pt-20`}>
        <div>
          <p className="eyebrow">TRES65 Inmobiliaria · Mérida, Yucatán</p>
          <h1 className="mt-4 font-serif text-[2.6rem] leading-[1.05] font-semibold tracking-tight text-profundo sm:text-6xl">
            Diversifica tu patrimonio en Mérida
          </h1>
          <p className="mt-5 max-w-xl text-lg text-suave sm:text-xl">
            Conoce oportunidades inmobiliarias seleccionadas de acuerdo con tus objetivos, horizonte de inversión y
            perfil.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#merida" className={btn.primary}>
              Conocer oportunidades
              <ArrowDown aria-hidden className="size-4" />
            </a>
            <a href="#cuestionario" className={btn.secondary}>
              Responder cuestionario
            </a>
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm text-suave">
            <Clock3 aria-hidden className="size-4 text-acento" />
            Te tomará aproximadamente 2 minutos.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[20rem] md:max-w-none">
          <div className="house-mask relative aspect-[4/5] overflow-hidden bg-arena">
            <Image
              src={hero}
              alt="Fachada contemporánea con celosía y piedra, en Mérida"
              fill
              priority
              sizes="(min-width: 768px) 40vw, 90vw"
              className="object-cover object-[50%_78%]"
            />
          </div>
          <div
            aria-hidden
            className="absolute -bottom-3 left-1/2 h-3 w-[92%] -translate-x-1/2 rounded-b-xl bg-acento/80"
          />
        </div>
      </div>
    </section>
  );
}

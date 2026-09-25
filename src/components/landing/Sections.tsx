import Image from "next/image";
import {
  BadgeCheck,
  ClipboardList,
  HandHeart,
  Landmark,
  Layers,
  MessageCircle,
  Presentation,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import ampi from "@/assets/ampi-merida.png";
import fachada from "@/assets/fachada-merida.jpg";
import { container } from "@/components/ui";
import { AGENT, SITE } from "@/config/site";

/* 2. Quiénes somos --------------------------------------------------------- */
export function About() {
  return (
    <section id="nosotros" className="py-16 sm:py-24">
      <div className={`${container} grid gap-10 md:grid-cols-2 md:items-center md:gap-16`}>
        <div>
          <p className="eyebrow">Quiénes somos</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-profundo sm:text-4xl">
            Más de {SITE.yearsOfExperience} años acompañando decisiones inmobiliarias en Mérida
          </h2>
          <p className="mt-5 text-suave">
            TRES65 Inmobiliaria es una agencia de bienes raíces en Mérida, Yucatán. Conocemos la ciudad y sus
            alrededores, y trabajamos de cerca con cada persona para que tome decisiones informadas, a su ritmo y con
            claridad.
          </p>
          <p className="mt-4 text-suave">
            Actualmente contamos con un portafolio de propiedades exclusivas en Mérida, pensadas para quien busca un
            activo tangible y de calidad como parte de su patrimonio.
          </p>
        </div>

        <figure className="rounded-3xl border border-borde bg-white p-6 shadow-[0_1px_0_rgba(26,79,92,.04),0_20px_40px_-24px_rgba(26,79,92,.35)] sm:p-8">
          <div className="flex items-center gap-4">
            <div
              aria-hidden
              className="grid size-14 shrink-0 place-items-center rounded-full bg-menta font-serif text-xl font-semibold text-profundo"
            >
              DT
            </div>
            <div>
              <p className="font-semibold text-profundo">{AGENT.name}</p>
              <p className="text-sm text-suave">{AGENT.role} · TRES65</p>
            </div>
          </div>
          <blockquote className="mt-5 font-serif text-lg leading-relaxed text-texto">
            “Antes de compartirte detalles de cualquier propiedad, me gustaría conocer tu perspectiva y ver si esto
            resuena con tus objetivos actuales.”
          </blockquote>
          <figcaption className="mt-4 text-sm text-suave">Serás atendido/a directamente por Damara.</figcaption>
        </figure>
      </div>
    </section>
  );
}

/* 3. Por qué Mérida -------------------------------------------------------- */
const MERIDA_POINTS = [
  {
    icon: Landmark,
    title: "Un activo tangible",
    text: "Una propiedad es un bien físico que puedes ver, visitar y, en su caso, usar.",
  },
  {
    icon: Layers,
    title: "Diversificación",
    text: "Una forma de equilibrar tu patrimonio fuera de los instrumentos financieros tradicionales.",
  },
  {
    icon: Sprout,
    title: "Visión a mediano y largo plazo",
    text: "Un patrimonio que puedes conservar, capitalizar o heredar a tu familia.",
  },
];

export function WhyMerida() {
  return (
    <section id="merida" className="bg-profundo py-16 text-white sm:py-24">
      <div className={`${container} grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-16`}>
        <div className="relative order-last md:order-first">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-medio md:aspect-[4/5]">
            <Image
              src={fachada}
              alt="Casa contemporánea con muro de piedra en Mérida"
              fill
              sizes="(min-width: 768px) 40vw, 90vw"
              className="object-cover object-[50%_60%]"
            />
          </div>
        </div>
        <div>
          <p className="eyebrow !text-acento">La oportunidad</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">¿Por qué Mérida?</h2>
          <p className="mt-5 text-white/85">
            Mérida vive un crecimiento sostenido que la ha puesto en el radar de quienes buscan invertir en bienes
            raíces en México. Para muchas personas, una propiedad aquí es una manera de construir patrimonio con algo
            concreto.
          </p>
          <ul className="mt-8 grid gap-4">
            {MERIDA_POINTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4 rounded-2xl bg-white/[.06] p-5 ring-1 ring-white/10">
                <Icon aria-hidden className="mt-0.5 size-6 shrink-0 text-acento" />
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-white/80">{text}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-white/65">
            No hablamos de rendimientos garantizados. Cada oportunidad se revisa contigo con información concreta para
            que decidas si tiene sentido para ti.
          </p>
        </div>
      </div>
    </section>
  );
}

/* 4. Por qué TRES65 -------------------------------------------------------- */
const PILLARS = [
  {
    icon: BadgeCheck,
    title: "Asesores certificados",
    text: "Certificados por AMPI, bajo el estándar de competencia CONOCER y con certificación INSEJUPY.",
  },
  {
    icon: HandHeart,
    title: "Acompañamiento personal",
    text: "Un equipo que acompaña personalmente cada proceso y resuelve tus dudas en cada paso.",
  },
  {
    icon: ShieldCheck,
    title: "Honestidad y transparencia",
    text: "Valores que ponemos por encima de la venta, en cada conversación y en cada operación.",
  },
];

export function WhyTres65() {
  return (
    <section id="por-que-tres65" className="bg-piedra py-16 sm:py-24">
      <div className={container}>
        <div className="max-w-2xl">
          <p className="eyebrow">Por qué TRES65</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-profundo sm:text-4xl">
            La tranquilidad de hablar con profesionales serios
          </h2>
        </div>

        <ul className="mt-10 grid gap-4 md:grid-cols-3 md:gap-6">
          {PILLARS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-3xl border border-borde bg-white p-6 sm:p-7">
              <span className="grid size-12 place-items-center rounded-2xl bg-menta">
                <Icon aria-hidden className="size-6 text-medio" />
              </span>
              <p className="mt-5 text-lg font-semibold text-profundo">{title}</p>
              <p className="mt-2 text-suave">{text}</p>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col items-start gap-6 rounded-3xl bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <p className="max-w-2xl font-serif text-xl leading-snug text-profundo sm:text-2xl">
            “Nuestro compromiso no es solo cerrar una operación, sino asegurarnos de que la decisión que tomes sea la
            correcta para ti.”
          </p>
          <Image src={ampi} alt="AMPI Mérida" className="h-10 w-auto shrink-0 sm:h-12" />
        </div>
      </div>
    </section>
  );
}

/* 5. Primero queremos conocerte -------------------------------------------- */
const PROCESS = [
  {
    icon: ClipboardList,
    title: "Respondes el cuestionario",
    text: "Unas preguntas breves sobre tu perfil y lo que buscas. Toma alrededor de 2 minutos.",
  },
  {
    icon: MessageCircle,
    title: "Damara revisa tu perfil",
    text: "Te contacta para platicar y preparar información relevante para ti, sin compromiso.",
  },
  {
    icon: Presentation,
    title: "Presentación privada",
    text: "Si te interesa, recibes la invitación a una presentación breve (1.5 horas) sobre oportunidades en Mérida.",
  },
];

export function Process() {
  return (
    <section aria-labelledby="proceso-titulo" className="py-16 sm:py-20">
      <div className={container}>
        <div className="max-w-2xl">
          <p className="eyebrow">Cómo funciona</p>
          <h2 id="proceso-titulo" className="mt-3 font-serif text-3xl font-semibold text-profundo sm:text-4xl">
            Primero, queremos conocerte
          </h2>
          <p className="mt-4 text-suave">
            No enviamos catálogos genéricos. Con tus respuestas entendemos si esto es relevante para ti en este momento
            y qué opciones vale la pena mostrarte.
          </p>
        </div>
        <ol className="mt-10 grid gap-4 md:grid-cols-3 md:gap-6">
          {PROCESS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="relative rounded-3xl border border-borde p-6">
              <span className="font-serif text-4xl font-semibold text-acento/40" aria-hidden>
                0{i + 1}
              </span>
              <Icon aria-hidden className="absolute top-6 right-6 size-6 text-medio" />
              <p className="mt-3 text-lg font-semibold text-profundo">{title}</p>
              <p className="mt-2 text-suave">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

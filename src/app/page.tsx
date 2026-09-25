import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { About, Process, WhyMerida, WhyTres65 } from "@/components/landing/Sections";
import { Questionnaire } from "@/components/questionnaire/Questionnaire";
import { container } from "@/components/ui";

export default function Home() {
  return (
    <>
      <a
        href="#cuestionario"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:shadow"
      >
        Ir al cuestionario
      </a>
      <Header />
      <main>
        <Hero />
        <About />
        <WhyMerida />
        <WhyTres65 />
        <Process />
        <section id="cuestionario" aria-labelledby="cuestionario-titulo" className="bg-menta/60 py-16 sm:py-24">
          <div className={`${container} max-w-3xl`}>
            <div className="mb-8 text-center sm:mb-10">
              <p className="eyebrow">Cuestionario de interés</p>
              <h2 id="cuestionario-titulo" className="mt-3 font-serif text-3xl font-semibold text-profundo sm:text-4xl">
                Cuéntanos sobre ti
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-suave">
                Estas preguntas nos ayudan a conocerte mejor y a preparar información personalizada para ti.
              </p>
            </div>
            <Questionnaire />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

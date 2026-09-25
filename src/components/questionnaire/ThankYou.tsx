"use client";

import type { RefObject } from "react";
import { CircleCheck, Mail, MessageCircle } from "lucide-react";
import { btn } from "@/components/ui";
import { AGENT, damaraWhatsappMessage, whatsappUrl } from "@/config/site";

export function ThankYou({
  name,
  eventInterest,
  headingRef,
}: {
  name: string;
  eventInterest: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const firstName = name.split(" ")[0];
  const wantsEvent = eventInterest === "si" || eventInterest === "tal_vez";

  return (
    <div
      role="status"
      className="rounded-[2rem] border border-borde bg-white p-6 text-center shadow-[0_30px_60px_-40px_rgba(26,79,92,.45)] sm:p-12"
    >
      <CircleCheck aria-hidden className="mx-auto size-14 text-acento" strokeWidth={1.5} />
      <h3
        ref={headingRef}
        tabIndex={-1}
        className="mt-5 font-serif text-3xl font-semibold text-profundo focus:outline-none sm:text-4xl"
      >
        Gracias, {firstName}
      </h3>
      <p className="mx-auto mt-4 max-w-md text-lg text-suave">
        Con tus respuestas podremos preparar información más relevante para ti.
      </p>
      {wantsEvent ? (
        <p className="mx-auto mt-4 max-w-md text-texto">
          Como te interesa la presentación, <strong>{AGENT.name}</strong> se pondrá en contacto contigo para compartirte
          los detalles.
        </p>
      ) : (
        <p className="mx-auto mt-4 max-w-md text-texto">
          <strong>{AGENT.name}</strong> revisará tu perfil y te contactará si tenemos algo que encaje con lo que buscas.
        </p>
      )}

      <div className="mt-8 flex flex-col items-center gap-3">
        <a
          href={whatsappUrl(AGENT.whatsapp, damaraWhatsappMessage(name))}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btn.whatsapp} w-full sm:w-auto`}
        >
          <MessageCircle aria-hidden className="size-5" /> Hablar con Damara
        </a>
        <a href={`mailto:${AGENT.email}`} className={`${btn.ghost} text-sm`}>
          <Mail aria-hidden className="size-4" /> {AGENT.email}
        </a>
      </div>
    </div>
  );
}

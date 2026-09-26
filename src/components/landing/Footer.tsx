import Image from "next/image";
import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";
import logosAmpiRealtor from "@/assets/logos-ampi-realtor.png";
import logoWhite from "@/assets/logo-tres65-blanco.png";
import { container } from "@/components/ui";
import { AGENT, GENERIC_WHATSAPP_MESSAGE, SITE, whatsappUrl } from "@/config/site";

/** Mismo esquema que el pie de los análisis comparativos de TRES65: marca a la
 * izquierda; asesora, contacto y logos AMPI / REALTOR alineados a la derecha. */
export function Footer() {
  const year = new Date().getFullYear();
  const link = "inline-flex min-h-10 items-center gap-2 hover:text-white md:flex-row-reverse";
  return (
    <footer id="contacto" className="bg-profundo text-white">
      <div className={`${container} flex flex-col gap-10 py-14 md:flex-row md:items-start md:justify-between md:py-16`}>
        <div>
          <Image src={logoWhite} alt="TRES65 Inmobiliaria" className="h-14 w-auto" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
            Especialistas en propiedades de
            <br />
            {SITE.city}.
            <br />
            Más de {SITE.yearsOfExperience} años en el mercado inmobiliario.
            <br />
            <a href={SITE.website} target="_blank" rel="noopener noreferrer" className="hover:text-white">
              www.tres65inmobiliaria.com
            </a>
          </p>
        </div>

        <div className="md:text-right">
          <p className="font-serif text-xl font-semibold">{AGENT.name}</p>
          <p className="mt-1 text-xs font-semibold tracking-[0.12em] text-acento uppercase">
            Asesora certificada · TRES65 Inmobiliaria
          </p>
          <ul className="mt-3 grid gap-0.5 text-sm text-white/70 md:justify-items-end">
            <li>
              <a className={link} href={whatsappUrl(AGENT.whatsapp, GENERIC_WHATSAPP_MESSAGE)} target="_blank" rel="noopener noreferrer">
                <MessageCircle aria-hidden className="size-4 text-acento" /> WhatsApp {AGENT.phoneDisplay}
              </a>
            </li>
            <li>
              <a className={link} href={`tel:+52${AGENT.phoneDisplay.replace(/\s/g, "")}`}>
                <Phone aria-hidden className="size-4 text-acento" /> {AGENT.phoneDisplay}
              </a>
            </li>
            <li>
              <a className={`${link} break-all`} href={`mailto:${AGENT.email}`}>
                <Mail aria-hidden className="size-4 shrink-0 text-acento" /> {AGENT.email}
              </a>
            </li>
          </ul>
          <Image
            src={logosAmpiRealtor}
            alt="AMPI Mérida y REALTOR"
            className="mt-3 h-20 w-auto md:ml-auto md:h-24"
          />
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className={`${container} flex flex-col gap-2 py-5 text-xs text-white/40 sm:flex-row sm:justify-between`}>
          <p>© {year} TRES65 Inmobiliaria® · Marca registrada · Todos los derechos reservados</p>
          <Link href="/aviso-de-privacidad/" className="underline-offset-4 hover:text-white hover:underline">
            Aviso de Privacidad
          </Link>
        </div>
      </div>
    </footer>
  );
}

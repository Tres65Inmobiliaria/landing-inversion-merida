import Image from "next/image";
import Link from "next/link";
import { Globe, Mail, MessageCircle, Phone } from "lucide-react";
import logoWhite from "@/assets/logo-tres65-blanco.png";
import { container } from "@/components/ui";
import { AGENT, GENERIC_WHATSAPP_MESSAGE, SITE, whatsappUrl } from "@/config/site";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer id="contacto" className="bg-profundo text-white">
      <div className={`${container} grid gap-10 py-14 md:grid-cols-[1fr_1.2fr] md:py-16`}>
        <div>
          <Image src={logoWhite} alt="TRES65 Inmobiliaria" className="h-12 w-auto" />
          <p className="mt-5 max-w-sm text-white/75">
            Más de {SITE.yearsOfExperience} años en el mercado inmobiliario de {SITE.city} y sus alrededores.
          </p>
        </div>

        <div>
          <p className="eyebrow !text-acento">Contacto</p>
          <p className="mt-3 font-serif text-2xl font-semibold">{AGENT.name}</p>
          <p className="text-white/75">{AGENT.role} · TRES65 Inmobiliaria</p>
          <ul className="mt-6 grid gap-3">
            <li>
              <a
                className="inline-flex min-h-11 items-center gap-3 hover:text-acento"
                href={whatsappUrl(AGENT.whatsapp, GENERIC_WHATSAPP_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle aria-hidden className="size-5 text-acento" /> WhatsApp {AGENT.phoneDisplay}
              </a>
            </li>
            <li>
              <a className="inline-flex min-h-11 items-center gap-3 hover:text-acento" href={`tel:+52${AGENT.phoneDisplay.replace(/\s/g, "")}`}>
                <Phone aria-hidden className="size-5 text-acento" /> {AGENT.phoneDisplay}
              </a>
            </li>
            <li>
              <a className="inline-flex min-h-11 items-center gap-3 break-all hover:text-acento" href={`mailto:${AGENT.email}`}>
                <Mail aria-hidden className="size-5 shrink-0 text-acento" /> {AGENT.email}
              </a>
            </li>
            <li>
              <a
                className="inline-flex min-h-11 items-center gap-3 hover:text-acento"
                href={SITE.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Globe aria-hidden className="size-5 text-acento" /> www.tres65inmobiliaria.com
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className={`${container} flex flex-col gap-2 py-6 text-sm text-white/60 sm:flex-row sm:justify-between`}>
          <p>© {year} TRES65 Inmobiliaria. Mérida, Yucatán.</p>
          <Link href="/aviso-de-privacidad/" className="underline-offset-4 hover:text-white hover:underline">
            Aviso de Privacidad
          </Link>
        </div>
      </div>
    </footer>
  );
}

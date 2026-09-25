"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import type { Option } from "@/config/questionnaire";

const errorId = (name: string) => `${name}-error`;
const hintId = (name: string) => `${name}-hint`;

function FieldError({ name, error }: { name: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={errorId(name)} className="mt-2 text-sm font-medium text-error" role="alert">
      {error}
    </p>
  );
}

function describedBy(name: string, hint?: string, error?: string) {
  return [hint ? hintId(name) : null, error ? errorId(name) : null].filter(Boolean).join(" ") || undefined;
}

const inputClass =
  "mt-2 block min-h-13 w-full rounded-2xl border border-borde bg-white px-4 py-3 text-base text-texto placeholder:text-suave/60 transition focus:border-medio focus:outline-none focus:ring-4 focus:ring-acento/20 aria-[invalid=true]:border-error";

export function TextField(props: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel";
  placeholder?: string;
  maxLength?: number;
  optional?: boolean;
}) {
  const { name, label, value, onChange, error, hint, type = "text", optional, ...rest } = props;
  return (
    <div>
      <label htmlFor={name} className="block text-base font-semibold text-profundo">
        {label}
        {optional && <span className="ml-2 text-sm font-normal text-suave">(opcional)</span>}
      </label>
      {hint && (
        <p id={hintId(name)} className="mt-1 text-sm text-suave">
          {hint}
        </p>
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, hint, error)}
        className={inputClass}
        {...rest}
      />
      <FieldError name={name} error={error} />
    </div>
  );
}

const optionClass =
  "group flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border border-borde bg-white px-4 py-3 text-base leading-snug transition hover:border-acento has-[:checked]:border-medio has-[:checked]:bg-menta has-[:checked]:font-semibold has-[:checked]:text-profundo has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-acento/30";

function Indicator({ multi }: { multi?: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid size-6 shrink-0 place-items-center border-2 border-borde bg-white transition group-has-[:checked]:border-medio group-has-[:checked]:bg-medio ${
        multi ? "rounded-md" : "rounded-full"
      }`}
    >
      <Check className="size-4 text-white opacity-0 group-has-[:checked]:opacity-100" strokeWidth={3} />
    </span>
  );
}

function Group(props: {
  name: string;
  legend: string;
  hint?: string;
  error?: string;
  columns?: boolean;
  children: ReactNode;
}) {
  const { name, legend, hint, error, columns, children } = props;
  return (
    <fieldset
      id={name}
      tabIndex={-1}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(name, hint, error)}
      className="focus:outline-none"
    >
      <legend className="text-base font-semibold text-profundo">{legend}</legend>
      {hint && (
        <p id={hintId(name)} className="mt-1 text-sm text-suave">
          {hint}
        </p>
      )}
      <div className={`mt-3 grid gap-2.5 ${columns ? "sm:grid-cols-2" : ""}`}>{children}</div>
      <FieldError name={name} error={error} />
    </fieldset>
  );
}

export function ChoiceGroup(props: {
  name: string;
  legend: string;
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  columns?: boolean;
}) {
  const { name, options, value, onChange } = props;
  return (
    <Group {...props}>
      {options.map((o) => (
        <label key={o.value} className={optionClass}>
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="sr-only"
          />
          <Indicator />
          <span>{o.label}</span>
        </label>
      ))}
    </Group>
  );
}

export function MultiChoice(props: {
  name: string;
  legend: string;
  options: Option[];
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
  hint?: string;
  columns?: boolean;
  /** Opción que, al elegirse, deselecciona las demás (y viceversa). */
  exclusive?: string;
}) {
  const { name, options, value, onChange, exclusive } = props;
  const toggle = (v: string) => {
    if (value.includes(v)) return onChange(value.filter((x) => x !== v));
    if (exclusive && v === exclusive) return onChange([v]);
    onChange([...value.filter((x) => x !== exclusive), v]);
  };
  return (
    <Group {...props}>
      {options.map((o) => (
        <label key={o.value} className={optionClass}>
          <input
            type="checkbox"
            name={name}
            value={o.value}
            checked={value.includes(o.value)}
            onChange={() => toggle(o.value)}
            className="sr-only"
          />
          <Indicator multi />
          <span>{o.label}</span>
        </label>
      ))}
    </Group>
  );
}

export function Checkbox(props: {
  name: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
  error?: string;
}) {
  const { name, checked, onChange, children, error } = props;
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl p-1 text-base">
        <input
          id={name}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId(name) : undefined}
          className="mt-0.5 size-6 shrink-0 cursor-pointer rounded accent-[#1e7a6e]"
        />
        <span>{children}</span>
      </label>
      <FieldError name={name} error={error} />
    </div>
  );
}

import { useId, type ReactNode } from "react";

interface BaseProps {
  label: string;
  hint?: string;
}

function Field({ label, hint, id, children }: BaseProps & { id: string; children: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint ? (
        <p className="hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {children}
    </div>
  );
}

export function TextField(props: BaseProps & { value: string; onChange: (v: string) => void; type?: "text" | "date" }) {
  const id = useId();
  return (
    <Field {...props} id={id}>
      <input
        id={id}
        type={props.type ?? "text"}
        value={props.value}
        aria-describedby={props.hint ? `${id}-hint` : undefined}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </Field>
  );
}

export function TextArea(props: BaseProps & { value: string; onChange: (v: string) => void; rows?: number }) {
  const id = useId();
  return (
    <Field {...props} id={id}>
      <textarea
        id={id}
        rows={props.rows ?? 3}
        value={props.value}
        aria-describedby={props.hint ? `${id}-hint` : undefined}
        onChange={(e) => props.onChange(e.target.value)}
      />
    </Field>
  );
}

export function Select<T extends string | number>(
  props: BaseProps & { value: T; options: readonly { value: T; label: string }[]; onChange: (v: T) => void },
) {
  const id = useId();
  return (
    <Field {...props} id={id}>
      <select
        id={id}
        value={String(props.value)}
        onChange={(e) => {
          const picked = props.options.find((o) => String(o.value) === e.target.value);
          if (picked) props.onChange(picked.value);
        }}
      >
        {props.options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Check(props: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className="field check">
      <input id={id} type="checkbox" checked={props.checked} onChange={(e) => props.onChange(e.target.checked)} />
      <label htmlFor={id}>{props.label}</label>
    </div>
  );
}

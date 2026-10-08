import { useEffect, useRef, type ComponentProps, type RefObject } from "react";

// React 18 does not bind change events or boolean properties on custom elements.
// Keep Polaris markup and styling while wiring the native DOM controls directly.
function useNativeChange<T extends "s-select" | "s-checkbox">(ref: RefObject<HTMLElementTagNameMap[T]>, handler?: ((event: Event & { currentTarget: HTMLElementTagNameMap[T] }) => void) | null) {
  const latest = useRef(handler); latest.current = handler;
  useEffect(() => {
    const element = ref.current;
    const change = (event: Event) => latest.current?.(event as Event & { currentTarget: HTMLElementTagNameMap[T] });
    element?.addEventListener("change", change);
    return () => element?.removeEventListener("change", change);
  }, [ref]);
}
function afterDefinition(tag: string, sync: () => void) {
  let active = true;
  if (window.customElements.get(tag)) sync();
  else void window.customElements.whenDefined(tag).then(() => { if (active) sync(); });
  return () => { active = false; };
}
export function PolarisSelect({ onChange, disabled, ...props }: Omit<ComponentProps<"s-select">, "ref">) {
  const ref = useRef<HTMLElementTagNameMap["s-select"]>(null);
  useNativeChange<"s-select">(ref, onChange);
  useEffect(() => afterDefinition("s-select", () => { if (ref.current) { ref.current.disabled = Boolean(disabled); if (props.value !== undefined) ref.current.value = props.value; } }));
  return <s-select {...props} disabled={disabled || undefined} ref={ref} />;
}
export function PolarisCheckbox({ onChange, checked, disabled, ...props }: Omit<ComponentProps<"s-checkbox">, "ref">) {
  const ref = useRef<HTMLElementTagNameMap["s-checkbox"]>(null);
  useNativeChange<"s-checkbox">(ref, onChange);
  useEffect(() => afterDefinition("s-checkbox", () => { if (ref.current) { ref.current.disabled = Boolean(disabled); ref.current.checked = Boolean(checked); } }));
  return <s-checkbox {...props} checked={checked || undefined} disabled={disabled || undefined} ref={ref} />;
}

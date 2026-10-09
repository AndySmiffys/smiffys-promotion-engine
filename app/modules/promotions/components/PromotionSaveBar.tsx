import { SaveBar } from "@shopify/app-bridge-react";
import { forwardRef, useId } from "react";

/** Let Shopify render Save and Discard in the admin's native top save bar. */
export const PromotionSaveBar = forwardRef<UISaveBarElement, {
  dirty: boolean;
  saving: boolean;
  busy: boolean;
  invalid: boolean;
  discardDisabled?: boolean;
  onSave: () => void;
  onDiscard: () => void;
}>(function PromotionSaveBar({ dirty, saving, busy, invalid, discardDisabled = false, onSave, onDiscard }, ref) {
  const id = useId();
  return (
    <SaveBar ref={ref} id={`promotion-save-bar-${id}`} open={dirty}>
      <button type="button" variant="primary" loading={saving ? "" : undefined}
        disabled={!dirty || saving || busy || invalid} onClick={onSave}>Save</button>
      <button type="button" disabled={!dirty || saving || busy || discardDisabled} onClick={onDiscard}>Discard</button>
    </SaveBar>
  );
});

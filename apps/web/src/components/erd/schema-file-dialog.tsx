import { LiveCodeSandboxWorkspace } from "@/components/ui/code-sandbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

import { normalizeSchemaFileName } from "@/lib/schema-file-utils";
import { DEFAULT_SCHEMA_CODE } from "@/stores/schema-files-store";

const SANDBOX_MAIN = "/schema.ts";

export type SchemaFileDialogMode = "add" | "edit";

export type SchemaFileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: SchemaFileDialogMode;
  /** Required when mode is \`edit\` */
  initialName?: string;
  initialCode?: string;
  onSave: (name: string, code: string) => void;
};

export function SchemaFileDialog({
  open,
  onOpenChange,
  mode,
  initialName = "schema",
  initialCode = DEFAULT_SCHEMA_CODE,
  onSave,
}: SchemaFileDialogProps) {
  const [name, setName] = useState(initialName);
  const [liveCode, setLiveCode] = useState(initialCode);
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    if (!open) return;
    setName(mode === "add" ? "schema" : initialName);
    setLiveCode(mode === "add" ? DEFAULT_SCHEMA_CODE : initialCode);
    setEditorKey((k) => k + 1);
  }, [open, mode, initialName, initialCode]);

  const title = mode === "add" ? "Add schema file" : "Edit schema file";

  const handleSave = () => {
    const n = normalizeSchemaFileName(name);
    if (!n) return;
    onSave(n, liveCode);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[min(90vh,920px)] max-w-[min(1200px,calc(100vw-1.5rem))] flex-col gap-3 overflow-hidden p-4 sm:max-w-[min(1200px,calc(100vw-1.5rem))]"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Name your file (extension is optional). Edit Drizzle schema in the sandbox; save adds or updates
            the sidebar entry.
          </DialogDescription>
        </DialogHeader>
        <div className="grid shrink-0 gap-2">
          <Label htmlFor="schema-file-name">File name</Label>
          <Input
            id="schema-file-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="schema"
            autoComplete="off"
          />
        </div>
        <div className="flex min-h-[380px] flex-1 flex-col overflow-hidden rounded-md border border-border">
          <LiveCodeSandboxWorkspace
            className="min-h-[380px] flex-1"
            mainFile={SANDBOX_MAIN}
            initialCode={mode === "add" ? DEFAULT_SCHEMA_CODE : initialCode}
            resetKey={String(editorKey)}
            onMainFileCodeChange={setLiveCode}
          />
        </div>
        <DialogFooter className="shrink-0 gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

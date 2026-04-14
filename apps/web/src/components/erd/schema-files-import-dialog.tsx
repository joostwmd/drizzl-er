import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { useCallback, useState } from "react";

import { stripSchemaExtensions } from "@/lib/schema-file-utils";
import { useSchemaFilesStore } from "@/stores/schema-files-store";

export type SchemaFilesImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SchemaFilesImportDialog({ open, onOpenChange }: SchemaFilesImportDialogProps) {
  const [uploadKey, setUploadKey] = useState(0);
  const addFile = useSchemaFilesStore((s) => s.addFile);

  const onAcceptFiles = useCallback(
    (accepted: File[]) => {
      void (async () => {
        for (const file of accepted) {
          const code = await file.text();
          const base = stripSchemaExtensions(file.name);
          addFile(base, code);
        }
        onOpenChange(false);
      })();
    },
    [addFile, onOpenChange],
  );

  const onDialogOpenChange = useCallback(
    (next: boolean) => {
      onOpenChange(next);
      if (!next) setUploadKey((k) => k + 1);
    },
    [onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onDialogOpenChange}>
      <DialogContent showCloseButton className="gap-3 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import files</DialogTitle>
          <DialogDescription>
            Drop files here or browse. Use Drizzle schema sources (.ts, .tsx, .js, .jsx, .mjs, .cjs).
          </DialogDescription>
        </DialogHeader>
        <FileUpload
          key={uploadKey}
          accept=".ts,.tsx,.js,.jsx,.mjs,.cjs"
          multiple
          onAccept={onAcceptFiles}
          className="w-full"
        >
          <FileUploadDropzone className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 border-dashed border-border bg-muted/30 px-4 py-6 text-center text-xs text-muted-foreground transition-colors hover:bg-muted/50">
            <span className="text-foreground">Drop files here</span>
            <FileUploadTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                Browse
              </Button>
            </FileUploadTrigger>
          </FileUploadDropzone>
        </FileUpload>
      </DialogContent>
    </Dialog>
  );
}

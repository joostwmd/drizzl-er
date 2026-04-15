import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockFilename,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/ai-elements/code-block";
import { FileCode2Icon } from "lucide-react";

export type SchemaFileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  initialCode?: string;
};

export function SchemaFileDialog({
  open,
  onOpenChange,
  initialName = "schema",
  initialCode = "",
}: SchemaFileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[min(90vh,920px)] max-w-[min(1200px,calc(100vw-1.5rem))] flex-col gap-3 overflow-hidden p-4"
      >
        <DialogHeader>
          <DialogTitle>Schema file</DialogTitle>
          <DialogDescription>
            Read-only source view. Drag and drop files in the sidebar to add new schema files.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-[380px] flex-1 overflow-auto rounded-md border border-border">
          <CodeBlock code={initialCode} language="typescript" showLineNumbers className="h-full border-0">
            <CodeBlockHeader>
              <CodeBlockTitle>
                <FileCode2Icon size={14} />
                <CodeBlockFilename>{initialName}.ts</CodeBlockFilename>
              </CodeBlockTitle>
              <CodeBlockActions>
                <CodeBlockCopyButton />
              </CodeBlockActions>
            </CodeBlockHeader>
          </CodeBlock>
        </div>
        <DialogFooter className="shrink-0 gap-2 sm:justify-end">
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

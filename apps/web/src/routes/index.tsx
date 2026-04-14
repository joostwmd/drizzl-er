import { env } from "@drizzl-er/env/web";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { FileDown, GithubIcon } from "lucide-react";
import { useCallback, useDeferredValue, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { ErdAppSidebar } from "@/components/erd/app-sidebar";
import { SchemaFileDialog, type SchemaFileDialogMode } from "@/components/erd/schema-file-dialog";
import { SchemaFilesImportDialog } from "@/components/erd/schema-files-import-dialog";
import {
  SchemaFlowCanvas,
  type SchemaFlowCanvasHandle,
  type SchemaFlowExportCapabilities,
} from "@/components/erd/schema-flow-canvas";
import { ModeToggle } from "@/components/mode-toggle";
import { getEffectiveSource, pageSubtitle } from "@/lib/schema-file-utils";
import { useSchemaFilesStore } from "@/stores/schema-files-store";

export const Route = createFileRoute("/")({
  component: IndexRoute,
});

function IndexRoute() {
  const canvasRef = useRef<SchemaFlowCanvasHandle>(null);
  const [exportCaps, setExportCaps] = useState<SchemaFlowExportCapabilities>({
    canExport: false,
    isExporting: false,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<SchemaFileDialogMode>("add");
  const [editId, setEditId] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const onExportCapabilitiesChange = useCallback((caps: SchemaFlowExportCapabilities) => {
    setExportCaps(caps);
  }, []);

  const { files, view, addFile, updateFile } = useSchemaFilesStore(
    useShallow((s) => ({
      files: s.files,
      view: s.view,
      addFile: s.addFile,
      updateFile: s.updateFile,
    })),
  );

  const effectiveSource = useMemo(() => getEffectiveSource(files, view), [files, view]);
  const graphSource = useDeferredValue(effectiveSource);
  const subtitle = useMemo(() => pageSubtitle(files, view), [files, view]);

  const editingFile = editId ? files.find((f) => f.id === editId) : undefined;

  const githubUrl = env.VITE_GITHUB_REPO_URL;

  return (
    <SidebarProvider className="flex h-full min-h-0 flex-1 overflow-hidden">
      <ErdAppSidebar
        onAddPaste={() => {
          setDialogMode("add");
          setEditId(null);
          setDialogOpen(true);
        }}
        onEditFile={(id) => {
          setDialogMode("edit");
          setEditId(id);
          setDialogOpen(true);
        }}
        onOpenImportDialog={() => setImportDialogOpen(true)}
      />
      <SidebarInset className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b px-3 md:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger />
            <p className="truncate text-muted-foreground text-sm">{subtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!exportCaps.canExport || exportCaps.isExporting}
              onClick={() => void canvasRef.current?.exportPdf()}
              aria-label="Export diagram as PDF"
            >
              <FileDown className="size-4" />
            </Button>
            <ModeToggle />
            {githubUrl ? (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                )}
              >
                <GithubIcon className="size-5" />
                <span className="sr-only">GitHub repository</span>
              </a>
            ) : null}
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-3 md:p-4">
          <SchemaFlowCanvas
            ref={canvasRef}
            source={graphSource}
            className="min-h-0 flex-1"
            onExportCapabilitiesChange={onExportCapabilitiesChange}
          />
        </div>
      </SidebarInset>
      <SchemaFileDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditId(null);
        }}
        mode={dialogMode}
        initialName={editingFile?.name}
        initialCode={editingFile?.code}
        onSave={(name, code) => {
          if (dialogMode === "add") {
            addFile(name, code);
          } else if (editId) {
            updateFile(editId, name, code);
          }
        }}
      />
      <SchemaFilesImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
    </SidebarProvider>
  );
}

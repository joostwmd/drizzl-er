import { env } from "@drizzl-er/env/web";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@drizzl-er/ui/components/sidebar";
import { cn } from "@drizzl-er/ui/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { GithubIcon } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { ErdAppSidebar } from "@/components/erd/app-sidebar";
import { SchemaFileDialog, type SchemaFileDialogMode } from "@/components/erd/schema-file-dialog";
import { SchemaFlowCanvas } from "@/components/erd/schema-flow-canvas";
import { ModeToggle } from "@/components/mode-toggle";
import { getEffectiveSource, pageSubtitle } from "@/lib/schema-file-utils";
import { useSchemaFilesStore } from "@/stores/schema-files-store";

export const Route = createFileRoute("/")({
  component: IndexRoute,
});

function IndexRoute() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<SchemaFileDialogMode>("add");
  const [editId, setEditId] = useState<string | null>(null);

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
    <SidebarProvider className="flex min-h-0 flex-1">
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
      />
      <SidebarInset className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b px-3 py-2.5 md:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger />
            <p className="truncate text-muted-foreground text-sm">{subtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <ModeToggle />
            {githubUrl ? (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                )}
              >
                <GithubIcon className="size-5" />
                <span className="sr-only">GitHub repository</span>
              </a>
            ) : null}
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-3 md:p-4">
          <SchemaFlowCanvas source={graphSource} className="min-h-0 flex-1" />
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
    </SidebarProvider>
  );
}

import { Button } from "@drizzl-er/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@drizzl-er/ui/components/dropdown-menu";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
} from "@drizzl-er/ui/components/file-upload";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@drizzl-er/ui/components/sidebar";
import { Separator } from "@drizzl-er/ui/components/separator";
import { FileTextIcon, LayersIcon, MoreHorizontalIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useCallback, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { stripSchemaExtensions } from "@/lib/schema-file-utils";
import { useSchemaFilesStore } from "@/stores/schema-files-store";

type AppSidebarProps = {
  onAddPaste: () => void;
  onEditFile: (id: string) => void;
};

export function ErdAppSidebar({ onAddPaste, onEditFile }: AppSidebarProps) {
  const [uploadKey, setUploadKey] = useState(0);
  const { files, view, setViewAll, setViewFile, addFile, removeFile } = useSchemaFilesStore(
    useShallow((s) => ({
      files: s.files,
      view: s.view,
      setViewAll: s.setViewAll,
      setViewFile: s.setViewFile,
      addFile: s.addFile,
      removeFile: s.removeFile,
    })),
  );

  const onAcceptFiles = useCallback(
    (accepted: File[]) => {
      void (async () => {
        for (const file of accepted) {
          const code = await file.text();
          const base = stripSchemaExtensions(file.name);
          addFile(base, code);
        }
        setUploadKey((k) => k + 1);
      })();
    },
    [addFile],
  );

  return (
    <Sidebar collapsible="offcanvas" variant="sidebar">
      <SidebarHeader className="gap-2 border-b border-sidebar-border pb-2">
        <div className="flex items-center px-1">
          <span className="font-semibold text-sidebar-foreground text-sm tracking-tight">Drizzl-er</span>
        </div>
        <Separator className="bg-sidebar-border" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Schema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={view.kind === "all"}
                  onClick={() => setViewAll()}
                  tooltip="Merged graph from every file"
                >
                  <LayersIcon />
                  <span>Whole schema</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Files</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {files.map((f) => (
                <SidebarMenuItem key={f.id}>
                  <SidebarMenuButton
                    isActive={view.kind === "file" && view.id === f.id}
                    onClick={() => setViewFile(f.id)}
                    tooltip={f.name}
                  >
                    <FileTextIcon />
                    <span>{f.name}</span>
                  </SidebarMenuButton>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <SidebarMenuAction showOnHover aria-label={`Actions for ${f.name}`} />
                      }
                    >
                      <MoreHorizontalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={() => {
                          // Defer past Base UI menu close so the handler still runs reliably.
                          queueMicrotask(() => onEditFile(f.id));
                        }}
                      >
                        <PencilIcon />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => {
                          queueMicrotask(() => removeFile(f.id));
                        }}
                      >
                        <Trash2Icon />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2 border-t border-sidebar-border p-2 pb-3">
        <div className="flex flex-col gap-1.5">
          <span className="px-1 text-[10px] text-sidebar-foreground/70 uppercase tracking-wide">Add files</span>
          <Button type="button" variant="outline" size="sm" className="w-full justify-start gap-2" onClick={onAddPaste}>
            <PlusIcon className="size-3.5" />
            Paste or type…
          </Button>
          <FileUpload
            key={uploadKey}
            accept=".ts,.tsx,.js,.jsx,.mjs,.cjs"
            multiple
            onAccept={onAcceptFiles}
            className="w-full"
          >
            <FileUploadDropzone className="min-h-[72px] border-sidebar-border bg-sidebar-accent/30 px-2 py-3 text-center text-[11px] text-sidebar-foreground/80 hover:bg-sidebar-accent/50">
              <span className="block">Drop Drizzle files here</span>
              <FileUploadTrigger className="mt-1 text-sidebar-foreground underline-offset-2 hover:underline">
                Browse files
              </FileUploadTrigger>
            </FileUploadDropzone>
          </FileUpload>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

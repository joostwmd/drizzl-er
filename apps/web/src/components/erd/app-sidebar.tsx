import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/sidebar";
import {
  FileUpload,
  FileUploadDropzone,
} from "@/components/ui/file-upload";
import {
  FileIcon,
  FileTextIcon,
  LayersIcon,
  MoreHorizontalIcon,
  EyeIcon,
  Trash2Icon,
} from "lucide-react";
import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";

import { stripSchemaExtensions } from "@/lib/schema-file-utils";
import { useSchemaFilesStore } from "@/stores/schema-files-store";

type AppSidebarProps = {
  onViewFile: (id: string) => void;
};

export function ErdAppSidebar({ onViewFile }: AppSidebarProps) {
  const { files, view, setViewAll, setViewFile, removeFile, addFile } = useSchemaFilesStore(
    useShallow((s) => ({
      files: s.files,
      view: s.view,
      setViewAll: s.setViewAll,
      setViewFile: s.setViewFile,
      removeFile: s.removeFile,
      addFile: s.addFile,
    })),
  );

  const onAcceptFiles = useCallback(
    (accepted: File[]) => {
      void (async () => {
        for (const file of accepted) {
          const code = await file.text();
          addFile(stripSchemaExtensions(file.name), code);
        }
      })();
    },
    [addFile],
  );

  return (
    <Sidebar collapsible="offcanvas" variant="sidebar">
      <SidebarHeader className="flex h-12 shrink-0 flex-row items-center gap-0 border-b px-3 py-0 md:px-4">
        <span className="font-semibold text-sidebar-foreground text-sm tracking-tight">Drizzl-ER</span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
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
                          queueMicrotask(() => onViewFile(f.id));
                        }}
                      >
                        <EyeIcon />
                        View
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
        <span className="px-1 text-[10px] text-sidebar-foreground/70 uppercase tracking-wide">
          Drop files to add
        </span>
        <FileUpload
          accept=".ts,.tsx,.js,.jsx,.mjs,.cjs"
          multiple
          onAccept={onAcceptFiles}
          className="w-full"
        >
          <FileUploadDropzone
            className="group flex min-h-[232px] w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-sidebar-border bg-sidebar-accent/20 p-4 text-xs text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/30 data-[dragging]:border-primary/40 data-[dragging]:bg-sidebar-accent/35"
          >
            <div className="relative flex h-[182px] w-[148px] flex-col items-center justify-center rounded-sm border border-sidebar-border/80 bg-sidebar px-4 text-center shadow-sm transition-colors group-data-[dragging]:border-primary/70 group-data-[dragging]:bg-sidebar-accent/50">
              <div className="-top-px -right-px absolute h-5 w-5 border-sidebar-border/80 border-b border-l bg-sidebar-accent/60" />
              <FileIcon className="mb-2 size-5 text-sidebar-foreground/80" />
              <span className="font-medium text-[11px] text-sidebar-foreground">Drop schema files</span>
              <span className="mt-1 text-[10px] text-sidebar-foreground/60">or click to browse</span>
            </div>
          </FileUploadDropzone>
        </FileUpload>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

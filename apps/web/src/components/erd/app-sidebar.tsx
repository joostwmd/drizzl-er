import { Button } from "@/components/ui/button";
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
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  ClipboardPasteIcon,
  FileTextIcon,
  ImportIcon,
  LayersIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { useSchemaFilesStore } from "@/stores/schema-files-store";

type AppSidebarProps = {
  onAddPaste: () => void;
  onEditFile: (id: string) => void;
  onOpenImportDialog: () => void;
};

export function ErdAppSidebar({ onAddPaste, onEditFile, onOpenImportDialog }: AppSidebarProps) {
  const { files, view, setViewAll, setViewFile, removeFile } = useSchemaFilesStore(
    useShallow((s) => ({
      files: s.files,
      view: s.view,
      setViewAll: s.setViewAll,
      setViewFile: s.setViewFile,
      removeFile: s.removeFile,
    })),
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
        <div className="flex flex-col gap-2">
          <span className="px-1 text-[10px] text-sidebar-foreground/70 uppercase tracking-wide">Add files</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 border-sidebar-border bg-sidebar hover:bg-sidebar-accent/80"
            onClick={onAddPaste}
          >
            <ClipboardPasteIcon className="size-3.5" aria-hidden />
            Paste code
          </Button>
          <div className="relative py-0.5" aria-hidden>
            <div className="absolute inset-0 flex items-center">
              <Separator className="bg-sidebar-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-sidebar px-2 font-medium text-[10px] text-sidebar-foreground/60 uppercase tracking-wide">
                or
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 border-sidebar-border bg-sidebar hover:bg-sidebar-accent/80"
            onClick={onOpenImportDialog}
          >
            <ImportIcon className="size-3.5" aria-hidden />
            Import files
          </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

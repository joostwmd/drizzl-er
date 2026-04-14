"use client";

import type {
  CodeEditorProps,
  PreviewProps,
  SandpackLayoutProps,
  SandpackProviderProps,
} from "@codesandbox/sandpack-react";
import {
  getSandpackCssText,
  SandpackCodeEditor,
  SandpackConsole,
  SandpackFileExplorer,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@drizzl-er/ui/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@drizzl-er/ui/components/tabs";

export type { CodeEditorProps, PreviewProps, SandpackLayoutProps, SandpackProviderProps };

export type SandboxProviderProps = SandpackProviderProps;

export const SandboxProvider = ({
  className,
  children,
  ...props
}: SandboxProviderProps & { children?: ReactNode }): ReactNode => (
  <SandpackProvider className={cn("!flex !size-full !max-h-none min-h-0 flex-col", className)} {...props}>
    {children}
  </SandpackProvider>
);

export type SandboxLayoutProps = SandpackLayoutProps;

export const SandboxLayout = ({ className, ...props }: SandboxLayoutProps): ReactNode => (
  <SandpackLayout
    className={cn("!rounded-none !border-0 !bg-transparent !shadow-none", className)}
    {...props}
  />
);

function SandpackMainFileBridge({
  path,
  onCodeChange,
}: {
  path: string;
  onCodeChange?: (code: string) => void;
}) {
  const { sandpack } = useSandpack();
  const cb = useRef(onCodeChange);
  cb.current = onCodeChange;

  const raw = sandpack.files[path];
  const code = typeof raw === "string" ? raw : (raw?.code ?? "");

  useEffect(() => {
    cb.current?.(code);
  }, [code, path]);

  return null;
}

const SANDPACK_STYLE_ID = "sandpack-react-css";

function ensureSandpackStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(SANDPACK_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = SANDPACK_STYLE_ID;
  style.textContent = getSandpackCssText();
  document.head.appendChild(style);
}

const vanillaBootstrap = (mainFile: string) => {
  const rel = mainFile.startsWith("/") ? mainFile.slice(1) : mainFile;
  return `import "./${rel}";
const out = document.getElementById("app") ?? document.body;
if (out) {
  out.textContent = "Live preview (bundled with your schema).";
}
`;
};

export type LiveCodeSandboxWorkspaceProps = Omit<
  SandpackProviderProps,
  "children" | "files" | "template"
> & {
  /** File path shown in the editor (e.g. \`/schema.ts\`). */
  mainFile: string;
  /**
   * Starting file contents. Should stay stable while the user edits; only
   * change when switching documents (use \`resetKey\`) so the editor is not reset on every keystroke.
   */
  initialCode: string;
  onMainFileCodeChange?: (code: string) => void;
  className?: string;
  /** When this value changes, Sandpack remounts with the latest \`initialCode\`. */
  resetKey?: string;
  template?: SandpackProviderProps["template"];
};

/**
 * Sandpack with a split code + preview workspace tab and a console tab.
 * Theme follows `next-themes` when `theme` is not passed explicitly.
 */
export function LiveCodeSandboxWorkspace({
  className,
  mainFile,
  initialCode,
  onMainFileCodeChange,
  resetKey,
  template = "vanilla-ts",
  customSetup,
  options,
  theme: themeProp,
  ...rest
}: LiveCodeSandboxWorkspaceProps) {
  const { resolvedTheme } = useTheme();
  const sandpackTheme =
    themeProp ?? (resolvedTheme === "dark" ? "dark" : resolvedTheme === "light" ? "light" : "auto");

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    ensureSandpackStyles();
    setMounted(true);
  }, []);

  const files = useMemo(
    () => ({
      [mainFile]: initialCode,
      "/index.ts": vanillaBootstrap(mainFile),
    }),
    [mainFile, initialCode, resetKey],
  );

  const mergedSetup = useMemo(
    () => ({
      ...customSetup,
      dependencies: {
        "drizzle-orm": "0.45.1",
        ...customSetup?.dependencies,
      },
    }),
    [customSetup],
  );

  const mergedOptions = useMemo(
    () => ({
      initMode: "immediate" as const,
      recompileMode: "delayed" as const,
      recompileDelay: 400,
      activeFile: mainFile,
      visibleFiles: [mainFile],
      ...options,
    }),
    [mainFile, options],
  );

  if (!mounted) {
    return <div className={cn("min-h-[320px] w-full animate-pulse rounded-md border border-border bg-muted", className)} />;
  }

  return (
    <div className={cn("flex min-h-[320px] w-full flex-1 flex-col overflow-hidden rounded-md border border-border bg-background", className)}>
      <SandboxProvider
        key={resetKey === undefined ? "sandpack" : String(resetKey)}
        template={template}
        theme={sandpackTheme}
        files={files}
        customSetup={mergedSetup}
        options={mergedOptions}
        {...rest}
      >
        {onMainFileCodeChange ? (
          <SandpackMainFileBridge path={mainFile} onCodeChange={onMainFileCodeChange} />
        ) : null}
        <Tabs defaultValue="workspace" className="flex min-h-0 flex-1 flex-col gap-0">
          <TabsList
            variant="line"
            className="h-9 w-full shrink-0 justify-start gap-0 rounded-none border-b border-border bg-muted/40 px-2"
          >
            <TabsTrigger value="workspace" className="rounded-none px-3 text-xs">
              Workspace
            </TabsTrigger>
            <TabsTrigger value="console" className="rounded-none px-3 text-xs">
              Console
            </TabsTrigger>
          </TabsList>
          <TabsContent value="workspace" className="m-0 flex min-h-0 flex-1 flex-col overflow-hidden p-0">
            <SandboxLayout className="!h-full min-h-0 flex-1 [&_.sp-stack]:!h-full [&_.sp-stack]:min-h-0">
              <SandpackCodeEditor showTabs={false} showLineNumbers />
              <SandpackPreview showOpenInCodeSandbox={false} />
            </SandboxLayout>
          </TabsContent>
          <TabsContent value="console" className="m-0 flex min-h-0 flex-1 flex-col overflow-hidden p-0">
            <SandboxLayout className="!h-full min-h-0 flex-1 [&_.sp-stack]:!h-full [&_.sp-stack]:min-h-0">
              <SandpackConsole />
            </SandboxLayout>
          </TabsContent>
        </Tabs>
      </SandboxProvider>
    </div>
  );
}

export type SandboxCodeEditorProps = CodeEditorProps;

export const SandboxCodeEditor = (props: SandboxCodeEditorProps): ReactNode => (
  <SandpackCodeEditor {...props} />
);

export type SandboxPreviewProps = PreviewProps;

export const SandboxPreview = ({
  showOpenInCodeSandbox = false,
  ...props
}: SandboxPreviewProps): ReactNode => (
  <SandpackPreview showOpenInCodeSandbox={showOpenInCodeSandbox} {...props} />
);

export type SandboxConsoleProps = React.ComponentProps<typeof SandpackConsole>;

export const SandboxConsole = (props: SandboxConsoleProps): ReactNode => <SandpackConsole {...props} />;

export type SandboxFileExplorerProps = React.ComponentProps<typeof SandpackFileExplorer>;

export const SandboxFileExplorer = (props: SandboxFileExplorerProps): ReactNode => (
  <SandpackFileExplorer {...props} />
);

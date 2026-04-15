import { Toaster } from "@/components/ui/sonner";
import { HeadContent, Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { ThemeProvider } from "@/components/theme-provider";

export const Route = createRootRoute({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "drizzl-er",
      },
      {
        name: "description",
        content: "Visualize Drizzle ORM schemas as entity–relationship diagrams.",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        storageKey="vite-ui-theme"
      >
        <div className="grid h-svh min-h-0 w-full grid-rows-[minmax(0,1fr)] overflow-hidden">
          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden [&>*]:min-h-0 [&>*]:flex-1">
            <Outlet />
          </div>
        </div>
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
    </>
  );
}

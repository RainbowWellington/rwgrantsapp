import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { IdentityProvider } from "../lib/identity-context.js";
import { CallbackHandler } from "../components/CallbackHandler.js";

import "../styles.css";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Grants Portal",
      },
    ],
  }),
  shellComponent: RootDocument,
  component: () => (
    <IdentityProvider>
      <CallbackHandler>
        <Outlet />
      </CallbackHandler>
    </IdentityProvider>
  ),
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

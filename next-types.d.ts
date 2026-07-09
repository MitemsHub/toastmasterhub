declare module "next" {
  export interface Metadata {
    title?: string;
    description?: string;
    [key: string]: unknown;
  }

  export interface Viewport {
    [key: string]: unknown;
  }
}

declare module "next/headers" {
  export type CookieEntry = {
    name?: string;
    value: string;
  };

  export type CookieStore = {
    get(name: string): CookieEntry | undefined;
    set(
      name: string,
      value: string,
      options?: {
        httpOnly?: boolean;
        maxAge?: number;
        path?: string;
        sameSite?: "lax" | "strict" | "none";
        secure?: boolean;
      },
    ): void;
    delete(name: string): void;
  };

  export function cookies(): Promise<CookieStore>;
}

declare module "next/navigation" {
  export function redirect(path: string): never;
  export function usePathname(): string;
}

declare module "next/link" {
  import type { ReactNode } from "react";

  export default function Link(props: {
    href: string;
    children: ReactNode;
    className?: string;
  }): ReactNode;
}

declare module "next/script" {
  export default function Script(props: {
    id?: string;
    strategy?: "beforeInteractive" | "afterInteractive" | "lazyOnload" | "worker";
    dangerouslySetInnerHTML?: { __html: string };
  }): React.ReactNode;
}

declare module "next/font/google" {
  export function Geist(options: { variable: string; subsets: string[] }): { variable: string };
  export function Geist_Mono(options: { variable: string; subsets: string[] }): {
    variable: string;
  };
}

declare module "next/types.js" {
  import type { Metadata, Viewport } from "next";

  export type ResolvingMetadata = Promise<Metadata>;
  export type ResolvingViewport = Promise<Viewport>;
}

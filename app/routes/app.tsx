import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";

import {
  Link,
  Outlet,
  useLoaderData,
  useRouteError,
} from "react-router";

import {
  NavMenu,
} from "@shopify/app-bridge-react";

import {
  boundary,
} from "@shopify/shopify-app-react-router/server";

import {
  AppProvider,
} from "@shopify/shopify-app-react-router/react";

import { useEmbeddedAppUrl } from "../modules/navigation/embeddedAppUrl";

import { authenticate } from "../shopify.server";

export const loader = async ({
  request,
}: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  return {
    shop: session.shop,
    host: new URL(request.url).searchParams.get("host"),
    apiKey:
      process.env.SHOPIFY_API_KEY || "",
  };
};

export default function App() {
  const appUrl = useEmbeddedAppUrl();
  const { apiKey } =
    useLoaderData<typeof loader>();

  return (
    <AppProvider
      embedded
      apiKey={apiKey}
    >
      <NavMenu>
        <Link
          to={appUrl("/app")}
          rel="home"
        >
          Home
        </Link>

        <Link to={appUrl("/app/promotions")}>
          Promotions
        </Link>
      </NavMenu>

      <Outlet />
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(
    useRouteError(),
  );
}

export const headers: HeadersFunction = (
  headersArgs,
) => {
  return boundary.headers(headersArgs);
};

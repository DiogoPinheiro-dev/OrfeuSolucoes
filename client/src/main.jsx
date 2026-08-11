import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { lazy, Suspense } from "react";
import { ApolloProvider } from "@apollo/client/react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import { apolloClient } from "./lib/apolloClient";
import App from "./App.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RouteLoadingFallback from "./components/RouteLoadingFallback.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
const CompanyLogin = lazy(() => import("./pages/CompanyLogin.jsx"));
const Ecommerce = lazy(() => import("./pages/Ecommerce.jsx"));
const Home = lazy(() => import("./pages/Home.jsx"));
const Hub = lazy(() => import("./pages/Hub.jsx"));
const SolutionFeaturePage = lazy(() => import("./pages/SolutionFeaturePage.jsx"));
const SolutionWorkspace = lazy(() => import("./pages/SolutionWorkspace.jsx"));

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                index: true,
                element: <Home />
            },
            {
                path: "login",
                element: <CompanyLogin />
            },
            {
                path: "ecommerce",
                element: <Ecommerce />
            },
            {
                element: <ProtectedRoute />,
                children: [
                    {
                        path: "hub",
                        element: <Hub />
                    },
                    {
                        path: "hub/:slug",
                        element: <SolutionWorkspace />
                    },
                    {
                        path: "hub/:slug/:areaSlug",
                        element: <SolutionFeaturePage />
                    },
                    {
                        path: "hub/:slug/:areaSlug/:itemId",
                        element: <SolutionFeaturePage />
                    }
                ]
            }
        ]
    }
]);

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <ApolloProvider client={apolloClient}>
            <AuthProvider>
                <Suspense fallback={<RouteLoadingFallback />}>
                    <RouterProvider router={router} />
                </Suspense>
            </AuthProvider>
        </ApolloProvider>
    </StrictMode>
);

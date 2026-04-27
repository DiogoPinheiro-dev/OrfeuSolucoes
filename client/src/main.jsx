import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ApolloProvider } from "@apollo/client/react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import { apolloClient } from "./lib/apolloClient";
import App from "./App.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import CompanyLogin from "./pages/CompanyLogin.jsx";
import Ecommerce from "./pages/Ecommerce.jsx";
import Home from "./pages/Home.jsx";
import Hub from "./pages/Hub.jsx";
import SolutionFeaturePage from "./pages/SolutionFeaturePage.jsx";
import SolutionWorkspace from "./pages/SolutionWorkspace.jsx";

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
                <RouterProvider router={router} />
            </AuthProvider>
        </ApolloProvider>
    </StrictMode>
);

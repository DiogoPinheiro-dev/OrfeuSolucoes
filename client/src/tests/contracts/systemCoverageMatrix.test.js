import { describe, expect, it } from "vitest";

import { FEATURE_COMPONENT_REGISTRY } from "../../auth/hubConfig";
import {
    CROSS_CUTTING_COVERAGE_MATRIX,
    FEATURE_COVERAGE_MATRIX,
    SYSTEM_COVERAGE_MATRIX
} from "./systemCoverageMatrix";

describe("contrato de cobertura de regressão do sistema", () => {
    it("mantém todas as funcionalidades registradas no Hub na matriz", () => {
        const registeredKeys = Object.keys(FEATURE_COMPONENT_REGISTRY).sort();
        const coveredKeys = FEATURE_COVERAGE_MATRIX.map((item) => item.registryKey).sort();

        expect(coveredKeys).toEqual(registeredKeys);
    });

    it("não permite identificadores duplicados", () => {
        const ids = SYSTEM_COVERAGE_MATRIX.map((item) => item.id);

        expect(new Set(ids).size).toBe(ids.length);
    });

    it("exige camadas de componente, serviço, integração e navegador nas funcionalidades", () => {
        for (const item of FEATURE_COVERAGE_MATRIX) {
            expect(item.requiredLayers).toEqual(expect.arrayContaining([
                "component",
                "service",
                "integration",
                "browser"
            ]));
            expect(item.actions.length).toBeGreaterThan(0);
        }
    });

    it("preserva jornadas transversais críticas de sessão, Hub e autorização", () => {
        expect(CROSS_CUTTING_COVERAGE_MATRIX.map((item) => item.id)).toEqual(expect.arrayContaining([
            "auth.session",
            "hub.navigation",
            "permissions.isolation"
        ]));

        for (const item of CROSS_CUTTING_COVERAGE_MATRIX) {
            expect(item.scenarios.length).toBeGreaterThan(0);
            expect(item.requiredLayers.length).toBeGreaterThan(0);
        }
    });
});

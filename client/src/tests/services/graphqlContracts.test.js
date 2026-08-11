import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildSchema, Kind, validate } from "graphql";
import { describe, expect, it } from "vitest";

import * as operations from "../../../services/graphql/operations";

const schemaPath = fileURLToPath(new URL("../../../../server/src/schema.gql", import.meta.url));
const schema = buildSchema(readFileSync(schemaPath, "utf8"));
const executableDocuments = Object.entries(operations).filter(([, document]) =>
    document?.kind === Kind.DOCUMENT
    && document.definitions.some((definition) => definition.kind === Kind.OPERATION_DEFINITION)
);

describe("contratos GraphQL do frontend", () => {
    it("mantém todas as operações executáveis compatíveis com o schema real", () => {
        const failures = executableDocuments.flatMap(([exportName, document]) =>
            validate(schema, document).map((error) => `${exportName}: ${error.message}`)
        );

        expect(executableDocuments.length).toBeGreaterThan(100);
        expect(failures).toEqual([]);
    });

    it("mantém nomes únicos para queries e mutations", () => {
        const operationNames = executableDocuments.flatMap(([, document]) =>
            document.definitions
                .filter((definition) => definition.kind === Kind.OPERATION_DEFINITION)
                .map((definition) => definition.name?.value)
                .filter(Boolean)
        );

        expect(new Set(operationNames).size).toBe(operationNames.length);
    });
});

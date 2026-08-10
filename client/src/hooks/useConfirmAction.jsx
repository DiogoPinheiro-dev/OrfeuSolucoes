import { useEffect, useRef, useState } from "react";

import ConfirmDialog from "../components/ConfirmDialog";

export function useConfirmAction() {
    const resolverRef = useRef(null);
    const [confirmation, setConfirmation] = useState(null);

    useEffect(() => () => resolverRef.current?.(false), []);

    const settle = (confirmed) => {
        resolverRef.current?.(confirmed);
        resolverRef.current = null;
        setConfirmation(null);
    };

    const requestConfirmation = (options) => new Promise((resolve) => {
        resolverRef.current?.(false);
        resolverRef.current = resolve;
        setConfirmation(options);
    });

    const confirmationDialog = (
        <ConfirmDialog
            open={Boolean(confirmation)}
            title={confirmation?.title}
            message={confirmation?.message}
            confirmLabel={confirmation?.confirmLabel || "Confirmar"}
            cancelLabel={confirmation?.cancelLabel || "Cancelar"}
            variant={confirmation?.variant || "warning"}
            onCancel={() => settle(false)}
            onConfirm={() => settle(true)}
        />
    );

    return { requestConfirmation, confirmationDialog };
}

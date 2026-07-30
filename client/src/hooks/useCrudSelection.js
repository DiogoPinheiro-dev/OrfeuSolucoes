import { useEffect, useMemo, useState } from "react";

const defaultGetRowId = (row) => row.id;

export function useCrudSelection(rows = [], getRowId = defaultGetRowId) {
    const [selectedId, setSelectedId] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const visibleIds = useMemo(() => rows.map(getRowId), [getRowId, rows]);

    useEffect(() => {
        setSelectedId((current) => visibleIds.includes(current) ? current : null);
        setSelectedIds((current) => current.filter((id) => visibleIds.includes(id)));
    }, [visibleIds]);

    const selectRow = (id) => setSelectedId(id);

    const toggleSelected = (id) => {
        setSelectedId(id);
        setSelectedIds((current) =>
            current.includes(id)
                ? current.filter((selected) => selected !== id)
                : [...current, id]
        );
    };

    const toggleVisible = (checked, visibleRows) => {
        const ids = visibleRows.map(getRowId);
        setSelectedIds((current) => {
            if (!checked) {
                return current.filter((id) => !ids.includes(id));
            }
            return [...new Set([...current, ...ids])];
        });
        if (checked && ids.length) {
            setSelectedId(ids[0]);
        }
    };

    const resetSelection = () => {
        setSelectedId(null);
        setSelectedIds([]);
    };

    return {
        selectedId,
        selectedIds,
        selectRow,
        toggleSelected,
        toggleVisible,
        resetSelection
    };
}

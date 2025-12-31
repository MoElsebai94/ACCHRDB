const departments = [
    { id: 1, name: 'GM', parentId: null },
    { id: 2, name: 'Engineering', parentId: "1" }, // String parentID
    { id: "3", name: 'Backend', parentId: 2 },     // String ID
    { id: 4, name: 'DeepNested', parentId: "3" }   // String parentID to String ID
];

const getOrganizedDepartments = () => {
    const map = {};
    const roots = [];

    // Deep copy to avoid mutating state directly in complex ways during render
    const depts = departments.map(d => ({ ...d, children: [] }));

    depts.forEach(d => {
        map[d.id] = d;
    });

    depts.forEach(d => {
        // Strict check as in the code: if (d.parentId && map[d.parentId])
        if (d.parentId && map[d.parentId]) {
            map[d.parentId].children.push(d);
        } else {
            roots.push(d);
        }
    });

    // Flatten for display
    const flatten = (nodes, level = 0) => {
        let result = [];
        nodes.forEach(node => {
            result.push({ ...node, level });
            if (node.children.length > 0) {
                result = result.concat(flatten(node.children, level + 1));
            }
        });
        return result;
    };

    return flatten(roots);
};

const organized = getOrganizedDepartments();
console.log("ALL DEPARTMENTS WITH LEVELS:");
organized.forEach(d => console.log(`[${d.level}] ${d.name} (ParentType: ${typeof d.parentId})`));

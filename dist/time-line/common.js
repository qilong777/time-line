// 对象递归赋值,除了纯对象，其他的都直接赋值
export function traverseAssignObj(target, obj) {
    for (let key in obj) {
        if (typeof obj[key] === "object" && !Array.isArray(obj[key])) {
            if (target[key] === undefined) {
                target[key] = {};
            }
            traverseAssignObj(target[key], obj[key]);
        }
        else {
            target[key] = obj[key];
        }
    }
}

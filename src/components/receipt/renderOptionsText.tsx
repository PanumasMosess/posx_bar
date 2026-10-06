export function renderOptionsText(rawOptions: string | null) {
  if (!rawOptions || rawOptions === "{}" || rawOptions === "[]") return "";
  try {
    const parsed = JSON.parse(rawOptions);
    if (!parsed || typeof parsed !== "object") return "";

    const names: string[] = [];
    const values = Array.isArray(parsed) ? parsed : Object.values(parsed);

    values.forEach((item: any) => {
      if (Array.isArray(item)) {
        item.forEach((sub: any) => {
          if (typeof sub === "object" && sub?.name) names.push(sub.name);
          else if (typeof sub === "string") names.push(sub);
        });
      } else if (typeof item === "object" && item !== null) {
        if (item.name) names.push(item.name);
      } else if (typeof item === "string") {
        names.push(item);
      }
    });
    return names.join(", ");
  } catch (e) {
    return "";
  }
}
// Une chaîne vide serait convertie en 0 par z.coerce, et `formData.get` renvoie null pour un champ absent :
// dans les deux cas on veut « valeur non renseignée ».
export const emptyToUndefined = (value: unknown) =>
  value === "" || value === null || (typeof value === "string" && value.trim() === "") ? undefined : value;

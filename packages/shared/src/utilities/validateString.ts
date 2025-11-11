export const validateString = (string: string) =>
  /^(_|[a-zA-Z0-9])+(_?[a-zA-Z0-9]+)*$/.test(string);

export default validateString;

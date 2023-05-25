import {Logger} from "primate";

export default Object.fromEntries(Object.entries({
  EmptyStoreDirectory({root}) {
    return {
      message: ["empty store directory"],
      fix: ["populate % with stores or remove it", root],
      level: Logger.Warn,
    };
  },
  CannotUnpackValue({field, value, name, path, document: {id}}) {
    const fixes = [
      "change type for %s", `(await ${path}.get("${id}")).${field}`,
      "correct data in database",
    ];
    return {
      message: ["cannot unpack % to %", value, name],
      fix: [fixes.join(" or ")],
      level: Logger.Error,
    };
  },
  FailedDocumentValidation({errors}) {
    return {
      message: ["document validation failed for %", Object.keys(errors)],
      fix: ["check and fix errors"],
      level: Logger.Warn,
    };
  },
  InvalidType({name, store}) {
    return {
      message: ["field % in store % has invalid type" , name, store],
      fix: ["use a valid type"],
      level: Logger.Error,
    };
  },
  MissingPrimaryKey({primary, store}) {
    return {
      message: ["missing primary key % in store %", primary, store],
      fix: ["add an % field or set % to the store", "id",
        "export const ambiguous = true;"],
      level: Logger.Error,
    };
  },
  MissingStoreDirectory({root}) {
    return {
      message: ["missing store directory"],
      fix: ["create % and populate it", root],
      level: Logger.Warn,
    };
  },
  NoDocumentfound({value, path}) {
    return {
      message: ["no document found with primary key", value],
      fix: ["check for existence with %s first", `${path}.exists(id)`],
      level: Logger.Warn,
    };
  },
  TransactionRolledBack({id, name}) {
    return {
      message: ["transaction % rolled back due to previous error", id],
      fix: ["address previous % error", name],
      level: Logger.Warn,
    };
  },
}).map(([name, error]) =>
  [name, Logger.throwable(error, name, "primate/store")]));

import {keymap, valmap} from "runtime-compat/object";
import load from "../load.js";
import {ident} from "../base.js";

const nullToUndefined = delta =>
  valmap(delta, value => value === null ? undefined : value);

const predicate = criteria => {
  const keys = Object.keys(criteria);
  if (keys.length === 0) {
    return {where: "", bindings: {}};
  }

  const where = `where ${keys.map(key => `${key}=$${key}`).join(" and ")}`;

  return {where, bindings: criteria};
};

const change = delta => {
  const keys = Object.keys(delta);
  const set = keys.map(field => `${field}=$s_${field}`).join(",");
  return {
    set: `set ${set}`,
    bindings: keymap(delta, key => `s_${key}`),
  };
};

export default ({
  host = "http://localhost",
  port = 8000,
  path = "rpc",
  ns = "default",
  db,
  user,
  pass,
} = {}) => async () => {
  const Driver = await load("surrealdb.js");
  const client = new Driver(`${host}:${port}/${path}`);
  if (user !== undefined && pass !== undefined) {
    await client.signin({user, pass});
  }
  if (ns !== undefined && db !== undefined) {
    await client.use({ns, db});
  }

  return {
    name: "surrealdb",
    client,
    async start() {
      await client.query("begin transaction;");
    },
    async rollback() {
      await client.query("cancel transaction;");
    },
    async commit() {
      await client.query("commit transaction;");
    },
    end() {
      // noop
    },
    types: {
      primary: {
        validate(value) {
          return value;
        },
        ...ident,
      },
      object: ident,
      number: {
        in(value) {
          return value;
        },
        out(value) {
          return Number(value);
        },
      },
      bigint: {
        in(value) {
          return value.toString();
        },
        out(value) {
          return BigInt(value);
        },
      },
      boolean: ident,
      date: {
        in(value) {
          return value.toJSON();
        },
        out(value) {
          return new Date(value);
        },
      },
      string: ident,
    },
    async find(collection, criteria = {}) {
      const {where, bindings} = predicate(criteria);
      const query = `select * from ${collection} ${where}`;
      const [{result}] = await client.query(query, bindings);
      return result;
    },
    async count(collection, criteria = {}) {
      const {where, bindings} = predicate(criteria);
      const query = `select count() from ${collection} ${where}`;
      const [{result}] = await client.query(query, bindings);
      return result.length;
    },
    async get(collection, primary, value) {
      const query = `select * from ${collection} where ${primary}=$primary`;
      const [{result}] = await client.query(query, {primary: value});
      return result.length === 0
        ? undefined
        : result[0];
    },
    async insert(collection, primary, document) {
      const keys = Object.keys(document);
      const columns = keys.map(key => `${key}`);
      const values = keys.map(key => `$${key}`).join(",");
      const predicate = columns.length > 0
        ? `(${columns.join(",")}) values (${values})`
        : "{}";
      const query = `insert into ${collection} ${predicate}`;
      const [{result: [{id}]}] = await client.query(query, document);
      return {...document, id};
    },
    async update(collection, criteria = {}, delta) {
      const {where, bindings} = predicate(criteria);
      const {set, bindings: bindings2} = change(nullToUndefined(delta));
      const query = `update ${collection} ${set} ${where}`;
      const [{result}] = await client.query(query, {...bindings, ...bindings2});
      return result.length;
    },
    async delete(collection, criteria = {}) {
      const {where, bindings} = predicate(criteria);
      const query = `delete from ${collection} ${where} return diff`;
      const [{result}] = await client.query(query, bindings);
      return result.length;
    },
  };
};

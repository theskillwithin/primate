const actions = [
  "find",
  "count",
  "get",
  "insert",
  "update",
  "delete",
];
const write = ["insert", "update", "delete"];

export default (name, types, manager) => ({
  /* driver name, must be unique */
  name,
  /* start transaction */
  start() {
    return manager.open();
  },
  /* rollback any uncommited changes */
  async rollback() {
    manager.assert();
    await manager.read();
  },
  /* commit changes */
  async commit() {
    manager.assert();
    await manager.write();
    manager.flush();
  },
  /* end transaction */
  end() {
    manager.assert();
    if (manager.unflushed) {
      throw new Error("uncommited changes, rollback or commit before ending");
    }
    manager.close();
  },
  types,
  ...Object.fromEntries(actions.map(action => [action, (...args) =>
    manager.schedule(_actions => _actions[action](...args),
      write.includes(action)
    )])),

});
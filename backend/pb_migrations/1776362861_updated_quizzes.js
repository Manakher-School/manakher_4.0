/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_93315167")

  // update collection data
  unmarshal({
    "deleteRule": "@request.auth.id = teacher.id || @request.auth.role = \"admin\"",
    "updateRule": "@request.auth.id = teacher.id || @request.auth.role = \"admin\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_93315167")

  // update collection data
  unmarshal({
    "deleteRule": "@request.auth.id = teacher || @request.auth.role = \"admin\"",
    "updateRule": "@request.auth.id = teacher || @request.auth.role = \"admin\""
  }, collection)

  return app.save(collection)
})

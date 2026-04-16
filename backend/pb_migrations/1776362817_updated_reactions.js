/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1549310251")

  // update collection data
  unmarshal({
    "deleteRule": "@request.auth.id = user.id || @request.auth.role = \"admin\"",
    "updateRule": "@request.auth.id = user.id || @request.auth.role = \"admin\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1549310251")

  // update collection data
  unmarshal({
    "deleteRule": "@request.auth.id = user",
    "updateRule": null
  }, collection)

  return app.save(collection)
})

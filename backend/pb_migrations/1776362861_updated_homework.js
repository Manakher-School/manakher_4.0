/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3425588055")

  // update collection data
  unmarshal({
    "updateRule": "@request.auth.id = teacher.id || @request.auth.role = \"admin\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3425588055")

  // update collection data
  unmarshal({
    "updateRule": "@request.auth.id = teacher.id"
  }, collection)

  return app.save(collection)
})

/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3866499052")

  // update collection data
  unmarshal({
    "updateRule": "@request.auth.id = author.id || @request.auth.role = \"admin\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3866499052")

  // update collection data
  unmarshal({
    "updateRule": "@request.auth.id = author.id"
  }, collection)

  return app.save(collection)
})

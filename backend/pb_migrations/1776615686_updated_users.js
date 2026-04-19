/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // add username field
  collection.fields.add(new Field({
    "system": false,
    "id": "username_field",
    "name": "username",
    "type": "text",
    "required": false,
    "options": {
      "min": 3,
      "max": 30,
      "pattern": "^[a-zA-Z0-9_]+$"
    }
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // remove username field
  collection.fields.removeById("username_field")

  return app.save(collection)
})
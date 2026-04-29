/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3425588055")

  // add link_url field
  collection.fields.add(new Field({
    "hidden": false,
    "id": "url_link_hw",
    "max": 2000,
    "min": 0,
    "name": "link_url",
    "pattern": "",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "url"
  }))

  // add attachment field
  collection.fields.add(new Field({
    "hidden": false,
    "id": "file_attach_hw",
    "maxSelect": 1,
    "maxSize": 10485760, // 10MB
    "mimeTypes": ["application/pdf", "image/jpeg", "image/png", "image/webp", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    "name": "attachment",
    "presentable": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3425588055")

  // remove link_url field
  collection.fields.removeById("url_link_hw")
  // remove attachment field
  collection.fields.removeById("file_attach_hw")

  return app.save(collection)
})
/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3866499052")

  // add image field
  collection.fields.add(new Field({
    "hidden": false,
    "id": "file_image_ann",
    "maxSelect": 1,
    "maxSize": 5242880, // 5MB
    "mimeTypes": ["image/jpeg", "image/png", "image/webp", "image/gif"],
    "name": "image",
    "presentable": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  // add link_url field
  collection.fields.add(new Field({
    "hidden": false,
    "id": "url_link_ann",
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
    "id": "file_attach_ann",
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
  const collection = app.findCollectionByNameOrId("pbc_3866499052")

  // remove image field
  collection.fields.removeById("file_image_ann")
  // remove link_url field
  collection.fields.removeById("url_link_ann")
  // remove attachment field
  collection.fields.removeById("file_attach_ann")

  return app.save(collection)
})
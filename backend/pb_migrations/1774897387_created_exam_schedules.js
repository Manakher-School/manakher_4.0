/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.role = \"admin\"",
    "deleteRule": "@request.auth.role = \"admin\"",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_title",
        "max": 200,
        "min": 1,
        "name": "title",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_3949707534",
        "hidden": false,
        "id": "relation_subject",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "subject",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_3098803551",
        "hidden": false,
        "id": "relation_section",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "section",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "date_exam_date",
        "max": "",
        "min": "",
        "name": "exam_date",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "date"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_start_time",
        "max": 5,
        "min": 5,
        "name": "start_time",
        "pattern": "^[0-9]{2}:[0-9]{2}$",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_end_time",
        "max": 5,
        "min": 5,
        "name": "end_time",
        "pattern": "^[0-9]{2}:[0-9]{2}$",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
        {
          "hidden": false,
          "id": "select_exam_type",
          "maxSelect": 1,
          "name": "exam_type",
          "presentable": false,
          "required": true,
          "system": false,
          "type": "select",
          "values": [
            "month1",
            "month2",
            "month3",
            "final"
          ]
        },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_notes",
        "max": 500,
        "min": 0,
        "name": "notes",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation_created_by",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "created_by",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "autodate2990389176",
        "name": "created",
        "onCreate": { "enabled": true },
        "onUpdate": { "enabled": false },
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate3332085495",
        "name": "updated",
        "onCreate": { "enabled": true },
        "onUpdate": { "enabled": true },
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_exam_schedules_001",
    "indexes": [
      "CREATE INDEX idx_exam_date ON exam_schedules (exam_date)",
      "CREATE INDEX idx_exam_section ON exam_schedules (section)"
    ],
    "listRule": "@request.auth.id != \"\"",
    "name": "exam_schedules",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.role = \"admin\"",
    "viewRule": "@request.auth.id != \"\""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_exam_schedules_001");
  return app.delete(collection);
})

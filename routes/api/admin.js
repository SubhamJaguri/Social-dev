const AdminBro = require('admin-bro')
const AdminBroExpress = require('admin-bro-expressjs')

const express = require('express');
const router = express.Router();

const adminBro = new AdminBro({
    databases: [],
    rootPath: '/admin',
  })

 router = AdminBroExpress.buildRouter(adminBro)

module.exports = router;
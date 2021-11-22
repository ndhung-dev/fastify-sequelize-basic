const fastifyPlugin = require('fastify-plugin')
const path = require('path')
const resolve = require('path').resolve
const outputDir = path.join(__dirname, '../public');
const templatesFolder = 'views'

// To ask marko compile template from pre-loaded template for example from a web editor
// Pass the template as property templateSrc of opts
// The page parameter still should be passed and its path should exist in so that marko engine
// could lookup components along the parent path.

async function init (fastify, opts) {
  fastify.register(require('../helpers/mongoose'))

  await fastify.register(require('fastify-express'))
  fastify.use(require('cors')())

  fastify.register(require('fastify-static'), { root: outputDir,prefix: '/public' });
  fastify.register(require('../configs/view'), {
    engine: {
      marko: require("marko")
    },
    includeViewExtension: true,
    templates: templatesFolder,
    options: {
      filename: resolve(templatesFolder)
    },
    charset: 'utf-8'
  })

  fastify.register(require('./middlewares'))
  fastify.register(require('../queues/workers'))
}

module.exports = fastifyPlugin(init)

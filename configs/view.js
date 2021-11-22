'use strict'

const fp = require('fastify-plugin')
const readFile = require('fs').readFile
const accessSync = require('fs').accessSync
const resolve = require('path').resolve
const join = require('path').join
const { basename, dirname, extname } = require('path')
const HLRU = require('hashlru')
const supportedEngines = ['marko']

function fastifyView (fastify, opts, next) {
  if (!opts.engine) {
    next(new Error('Missing engine'))
    return
  }

  const type = Object.keys(opts.engine)[0]
  if (supportedEngines.indexOf(type) === -1) {
    next(new Error(`'${type}' not yet supported, PR? :)`))
    return
  }

  const charset = opts.charset || 'utf-8'
  const propertyName = opts.propertyName || 'view'
  const engine = opts.engine[type]
  const options = opts.options || {}
  const templatesDir = opts.root || resolve(opts.templates || './')
  const lru = HLRU(opts.maxCache || 100)
  const includeViewExtension = opts.includeViewExtension || false
  const viewExt = opts.viewExt || ''
  const prod = typeof opts.production === 'boolean' ? opts.production : process.env.NODE_ENV === 'production'
  const defaultCtx = opts.defaultContext || {}
  const layoutFileName = opts.layout

  if (layoutFileName && type !== 'marko') {
    next(new Error('Only marko support the "layout" option'))
    return
  }

  if (layoutFileName && !hasAccessToLayoutFile(layoutFileName, getDefaultExtension(type))) {
    next(new Error(`unable to access template "${layoutFileName}"`))
    return
  }

  const renders = {
    marko: viewMarko,
    _default: view
  }

  const renderer = renders[type] ? renders[type] : renders._default

  function viewDecorator () {
    const args = Array.from(arguments)

    let done
    if (typeof args[args.length - 1] === 'function') {
      done = args.pop()
    }

    const promise = new Promise((resolve, reject) => {
      renderer.apply({
        getHeader: () => { },
        header: () => { },
        send: result => {
          if (result instanceof Error) {
            reject(result)
            return
          }

          resolve(result)
        }
      }, args)
    })

    if (done && typeof done === 'function') {
      promise.then(done.bind(null, null), done)
      return
    }

    return promise
  }

  viewDecorator.clearCache = function () {
    lru.clear()
  }

  fastify.decorate(propertyName, viewDecorator)

  fastify.decorateReply(propertyName, function () {
    renderer.apply(this, arguments)
    return this
  })

  function getPage (page, extension) {
    const pageLRU = `getPage-${page}-${extension}`
    let result = lru.get(pageLRU)

    if (typeof result === 'string') {
      return result
    }

    const filename = basename(page, extname(page))
    result = join(dirname(page), filename + getExtension(page, extension))

    lru.set(pageLRU, result)

    return result
  }

  function getDefaultExtension (type) {
    const mappedExtensions = {
      'art-template': 'art',
      handlebars: 'hbs',
      nunjucks: 'njk'
    }

    return viewExt || (mappedExtensions[type] || type)
  }

  function getExtension (page, extension) {
    let filextension = extname(page)
    if (!filextension) {
      filextension = '.' + getDefaultExtension(type)
    }

    return viewExt ? `.${viewExt}` : (includeViewExtension ? `.${extension}` : filextension)
  }

  function readCallback (that, page, data) {
    return function _readCallback (err, html) {
      if (err) {
        that.send(err)
        return
      }

      let compiledPage
      try {
        options.filename = join(templatesDir, page)
        compiledPage = engine.compile(html, options)
      } catch (error) {
        that.send(error)
        return
      }
      lru.set(page, compiledPage)

      if (!that.getHeader('content-type')) {
        that.header('Content-Type', 'text/html; charset=' + charset)
      }
      let cachedPage
      try {
        cachedPage = lru.get(page)(data)
      } catch (error) {
        cachedPage = error
      }
      if (options.useHtmlMinifier && (typeof options.useHtmlMinifier.minify === 'function')) {
        cachedPage = options.useHtmlMinifier.minify(cachedPage, options.htmlMinifierOptions || {})
      }
      that.send(cachedPage)
    }
  }

  function view (page, data) {
    if (!page) {
      this.send(new Error('Missing page'))
      return
    }

    data = Object.assign({}, defaultCtx, this.locals, data)
    // append view extension
    page = getPage(page, type)

    const toHtml = lru.get(page)

    if (toHtml && prod) {
      if (!this.getHeader('content-type')) {
        this.header('Content-Type', 'text/html; charset=' + charset)
      }
      this.send(toHtml(data))
      return
    }

    readFile(join(templatesDir, page), 'utf8', readCallback(this, page, data))
  }

  function viewMarko (page, data, opts) {
    if (!page) {
      this.send(new Error('Missing page'))
      return
    }

    data = Object.assign({}, defaultCtx, this.locals, data)
    // append view extension
    page = getPage(page, type)

    // Support compile template from memory
    // opts.templateSrc : string - pre-loaded template source
    // even to load from memory, a page parameter still should be provided and the parent path should exist for the loader to search components along the path.

    const template = opts && opts.templateSrc ? engine.load(join(templatesDir, page), opts.templateSrc) : engine.load(join(templatesDir, page))

    if (opts && opts.stream) {
      if (typeof options.useHtmlMinifyStream === 'function') {
        this.send(template.stream(data).pipe(options.useHtmlMinifyStream(options.htmlMinifierOptions || {})))
      } else {
        this.send(template.stream(data))
      }
    } else {
      template.renderToString(data, send(this))
    }

    function send (that) {
      return function _send (err, html) {
        if (err) return that.send(err)
        if (options.useHtmlMinifier && (typeof options.useHtmlMinifier.minify === 'function')) {
          html = options.useHtmlMinifier.minify(html, options.htmlMinifierOptions || {})
        }
        that.header('Content-Type', 'text/html; charset=' + charset)
        that.send(html)
      }
    }
  }

  function hasAccessToLayoutFile (fileName, ext) {
    try {
      accessSync(join(templatesDir, getPage(fileName, ext)))

      return true
    } catch (e) {
      return false
    }
  }
  next()
}

module.exports = fp(fastifyView, {
  fastify: '3.x',
  name: 'point-of-view'
})
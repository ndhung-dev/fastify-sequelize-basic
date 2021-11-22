// Compiled using marko@4.24.2 - DO NOT EDIT
"use strict";

var marko_template = module.exports = require("marko/dist/html").t(__filename),
    marko_componentType = "/oio$1.0.0/views/pages/index.marko",
    marko_renderer = require("marko/dist/runtime/components/renderer"),
    helpers_escape_xml = require("marko/dist/runtime/html/helpers/escape-xml"),
    marko_escapeXml = helpers_escape_xml.x,
    marko_loadTemplate = require("marko/dist/runtime/helpers/load-template"),
    hello_template = marko_loadTemplate(require.resolve("../components/hello.marko")),
    marko_loadTag = require("marko/dist/runtime/helpers/load-tag"),
    hello_tag = marko_loadTag(hello_template),
    init_components_tag = marko_loadTag(require("marko/dist/core-tags/components/init-components-tag")),
    await_reorderer_tag = marko_loadTag(require("marko/dist/core-tags/core/await/reorderer-renderer")),
    _preferred_script_location_tag = marko_loadTag(require("marko/dist/core-tags/components/preferred-script-location-tag"));

function render(input, out, __component, component, state) {
  var data = input;

  out.w("<!doctype html><html><head><title>Our Funky HTML Page</title><meta name=description content=\"Our first page\"><meta name=keywords content=\"html tutorial template\"></head><body>Content goes here. " +
    marko_escapeXml(data.colors));

  hello_tag({
      name: data
    }, out, __component, "6");

  init_components_tag({}, out);

  await_reorderer_tag({}, out, __component, "7");

  _preferred_script_location_tag({}, out);

  out.w("</body></html>");
}

marko_template._ = marko_renderer(render, {
    d_: true,
    e_: marko_componentType
  });

marko_template.meta = {
    id: "/oio$1.0.0/views/pages/index.marko",
    tags: [
      "../components/hello.marko",
      "marko/dist/core-tags/components/init-components-tag",
      "marko/dist/core-tags/core/await/reorderer-renderer",
      "marko/dist/core-tags/components/preferred-script-location-tag"
    ]
  };

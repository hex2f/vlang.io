const nunjucks = require("nunjucks")
const sass = require('node-sass')
const NCP = require('ncp')
const CleanCSS = require('clean-css')
const fetch = require('node-fetch')
const mdtoc = require('markdown-toc')
const { promisify } = require('util')
const path = require("path")
const fs = require("fs")
const mkdir = promisify(fs.mkdir)
const writeFile = promisify(fs.writeFile)
const renderSass = promisify(sass.render)
const ncp = promisify(NCP.ncp)

const pages = [
  'index',
  'play',
  'docs'
]

async function compile() {
  console.log('Building docs')

  console.log('Setting up MD parser')
  var md = require('markdown-it')({})
    .use(require('markdown-it-toc-and-anchor').default, { slugify: require('uslug') })
  md.renderer.rules.fence = function (tokens, idx) {
    let code = tokens[idx].content
      .replace(/\n/g, '\\n')
      .replace(/"/g, '\\"')
    if (code.endsWith('\\n')) code = code.slice(0, -2)
    return `{% set code = "${code}" %}
{% set noheader = true  %}
{% include '../components/codeblock.njk' %}
{% set noheader = false %}\n`
  }

  console.log('Fetching MD from github')
  let docsMD = await fetch('https://raw.githubusercontent.com/memeone/v/memeone-patch-docs/doc/docs.md')

  console.log('Building NJK from MD')
  docsMD = await docsMD.text()
  let docs = md.render(docsMD)
  await writeFile('./pages/docs/content.njk', docs)

  console.log('Generating TOC')
  let toc = mdtoc(docsMD, {slugify: require('uslug') }).content
  console.log('Building NJK from MD TOC')
  toc = md.render(toc)
  await writeFile('./pages/docs/toc.njk', toc)

  console.log('Building pages')
  let buildDir = "./build"
  await mkdir(buildDir, { recursive: true })
  await Promise.all(
    pages.map(page =>
      writeFile(
        path.join(buildDir, page + ".html"),
        nunjucks.render(path.join("./pages", page + ".njk")),
        err => err && console.error(err)
      )
    )
  )

  console.log('Building sass')
  let app_sass = await renderSass({ file: './app.sass' })
  let clean_css = new CleanCSS({}).minify(app_sass.css.toString())
  await writeFile("./build/app.css", clean_css.styles, 'utf8')

  console.log('Copying res')
  ncp('./res', './build')
}

compile()

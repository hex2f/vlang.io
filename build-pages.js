const nunjucks = require("nunjucks")
const sass = require('node-sass')
const NCP = require('ncp')
const CleanCSS = require('clean-css')
const { promisify } = require('util')
const path = require("path")
const fs = require("fs")
const writeFile = promisify(fs.writeFile)
const renderSass = promisify(sass.render)
const ncp = promisify(NCP.ncp)

const pages = [
  'index'
]

async function compile() {
  console.log('Building pages')
  
  await Promise.all(
    pages.map(page =>
      writeFile(
        path.join("./build", page + ".html"),
        nunjucks.render(path.join("./pages", page + ".njk")),
        err => err && console.error(err)
      )
    )
  )
  
  console.log('Finished building pages')
  console.log('Building sass')

  let app_sass = await renderSass({ file: './app.sass' })
  let clean_css = new CleanCSS({}).minify(app_sass.css.toString())
  await writeFile("./build/app.css", clean_css.styles, 'utf8')

  console.log('Finished building sass')
  console.log('Copying res')

  ncp('./res', './build')
}

compile()
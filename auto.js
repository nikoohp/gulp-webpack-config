const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')

const root_path = process.argv[2]

/**
 * 文件遍历方法
 * @param root 需要遍历的文件路径
 */
function getAllFiles(root){
  var res = [] , files = fs.readdirSync(root);
  files.forEach(function(file){
    var pathname = root+'/'+file
    , stat = fs.lstatSync(pathname);

    if (!stat.isDirectory()){
      res.push(pathname.replace(root_path,'.'));
    } else {
      res = res.concat(getAllFiles(pathname));
    }
  })
  return res
}

const autoAddHash = () => {
  const currentpath = `${process.cwd()}/views/`
  const lists = fs.readFileSync(`${__dirname}/build.lst`, 'utf-8').split('\r\n')
  const s = new Set()
  lists.forEach(item => {
    s.add(item.split('\\')[0])
  })
  const obj = {}
  ;[...s].forEach(item => {
    if (item === '') return
    obj[item.split('\\')[0]] = 1
  })

  Object.keys(obj).forEach(item => {
    const allfiles = getAllFiles(currentpath + item)
    allfiles.forEach(file => {
      const filebuffer = fs.readFileSync(file)
      const $ = cheerio.load(filebuffer.toString())
      const scriptTag = $("[data-static='tag']")

      scriptTag.each(function(i, s) {
        if ($(this).attr('src')) {
          var script = $(this)
            .attr('src')
            .split('?')[0]
          var sc = script.split('statics/')[1].replace(/\//g, '\\')
        } else {
          var style = $(this)
            .attr('href')
            .split('?')[0]
          var st = style.split('statics/')[1].replace(/\//g, '\\')
        }

        if (lists.includes(sc)) {
          $(this).attr('src', `${script}?${+new Date()}`)
        }
        if (lists.includes(st)) {
          $(this).attr('href', `${style}?${+new Date()}`)
        }
      })

      fs.writeFileSync(file, $.html())
    })
  })

  fs.unlinkSync('./build.lst')
}

module.exports = autoAddHash
const { resolve, join, parse } = require('path')
const globby = require('globby')

// path.join('/foo', 'bar', 'baz/asdf', 'quux', '..')
// 返回: '/foo/bar/baz/asdf'

// path.parse('/home/user/dir/file.txt')
// 返回:
// { root: '/',
//   dir: '/home/user/dir',
//   base: 'file.txt',
//   ext: '.txt',
//   name: 'file' }

module.exports = app => {
  const AppPath = resolve(__dirname, 'app') // __dirname表示当前工作目录的绝对路径
  console.log(AppPath)
  const context = app['context']

  // 方法一
  const fileAbsolutePath = ['config', 'middleware', 'service']
    .reduce((folderMap, v) => ((folderMap[v] = join(AppPath, v)), folderMap), {})

  // 方法二
  // const fileAbsolutePath = {
  //   config: join(Apppath, 'config'),
  //   middleware: join(AppPath, 'middleware'),
  //   service: join(AppPath, 'service')
  // }

  Object.keys(fileAbsolutePath).forEach(v => {
    const path = fileAbsolutePath[v] // 对应的路径
    const prop = v // 挂载到 ctx 上面的 key

    // Returns an Array of matching paths.
    const files = globby.sync('**/*.js', {
      cwd: path // cwd 表示当前工作目录,默认值 process.cwd()
    })
    if (prop !== 'middleware') {
      context[prop] = {} // 初始化对象
    }

    files.forEach(file => {
      const filename = parse(file).name // 文件的名字作为 key 挂载到子对象上
      const content = require(join(path, file)) // 导入内容

      // middleware 处理逻辑
      if (prop === 'middleware') {
        if (filename in context['config']) { // context['config'] 有 filename 的属性名
          // 先传递配置项
          const plugin = content(context['config'][filename])
          app.use(plugin) // 加载中间件
        }
        return
      }

      // 配置文件处理
      if (prop === 'config' && content) {
        context[prop] = Object.assign({}, context[prop], content)
        return
      }

      context[prop][filename] = content // 挂载 service
    })
  })
}
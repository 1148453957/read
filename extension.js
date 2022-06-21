// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const $ = require("cheerio");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log("插件激活了");

  const request = require("superagent");
  require("superagent-charset")(request); // install charset

  let bookList = {
    1: {
      title: "明克街13号",
      link: "54529/",
    },2: {
      title: "诡秘之主",
      link: "36327/",
    },3: {
      title: "艾泽拉斯阴影轨迹",
      link: "53184/",
    },
  };
  let content = "";
  let pageIndex = 0;
  let log = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
  log.show();

  const tree2 = vscode.window.createTreeView("myviewDrh2", {
    treeDataProvider: treeDataProvider(bookList),
    showCollapseAll: true,
  });
  tree2.onDidChangeSelection((e) => {
    change(bookList[e.selection[0]].link);
  });

  function change(link) {
    request
      .get("https://www.xbiquge.so/book/" + link)
      .charset("gbk")
      .buffer(true)

      .end((err, res) => {
        const books = $.load(res.text);
        let obj = {};
        let data = books("#list dd a");
        data.each((index, item) => {
          obj[index] = {
            title: item.children[0].data,
            link: "https://www.xbiquge.so/book/" + link + item.attribs.href,
          };
        });

        const tree = vscode.window.createTreeView("myviewDrh", {
          treeDataProvider: treeDataProvider(obj),
          showCollapseAll: true,
        });
        tree.onDidChangeSelection((e) => {
          read(obj[e.selection[0]].link);
        });
      });
  }

/*   request
    .get("https://www.xbiquge.so/book/54529/")
    .charset("gbk")
    .buffer(true)
    .end((err, res) => {
      const books = $.load(res.text);
      let obj = {};
      let data = books("#list dd a");
      data.each((index, item) => {
        obj[index] = {
          title: item.children[0].data,
          link: "https://www.xbiquge.so/book/54529/" + item.attribs.href,
        };
      });

      const tree = vscode.window.createTreeView("myviewDrh", {
        treeDataProvider: treeDataProvider(obj),
        showCollapseAll: true,
      });
      tree.onDidChangeSelection((e) => {
        read(obj[e.selection[0]].link);
      });
    }); */

  function treeDataProvider(obj) {
    return {
      getChildren: (test) => {
        // 这里的test是点击选中的元素的id，因为最开始加载的时候，没有点击选中，所以是undefined
        if (test) {
          // 这里好像因为下面设置了none，所以都不执行了
          return [];
        } else {
          // 这里的test是点击选中的元素的id，因为最开始加载的时候，没有点击选中，所以是undefined,用obj来返回所有的元素的key
          return Object.keys(obj);
        }
      },
      getTreeItem: (index) => {
        // 这里根据上面的key去返回对应的元素，会执行很多遍， Object.keys(list)返回多少，就执行多少遍
        return {
          collapsibleState: vscode.TreeItemCollapsibleState.None, // 表示没有子集
          id: index,
          label: { label: obj[index].title, highlights: null },
          tooltip: new vscode.MarkdownString(`${obj[index].link}`, true),
        };
      },
    };
  }

  function read(link) {
    request
      .get(link)
      .charset("gbk")
      .buffer(true)

      .end((err, res) => {
        const books = $.load(res.text);
        content = books("#content").text();
        pageIndex = 0;
        let start = pageIndex * 60;
        let end = Math.min((pageIndex + 1) * 60, content.length - 1);
        log.text = content.slice(start, end);
      });
  }

  function nextPage() {
    ++pageIndex;
    log.show();

    // console.log("我执行了下一页");
    let start = pageIndex * 60;
    let end = Math.min((pageIndex + 1) * 60, content.length - 1);

    if (start > content.length - 1) {
      --pageIndex;

      log.text = "没有了";
    } else {
      log.text = content.slice(start, end);
    }
  }

  function beforePage() {
    // console.log("我执行了上一页");
    log.show();

    --pageIndex;
    let start = pageIndex * 60;
    let end = Math.min((pageIndex + 1) * 60, content.length - 1);
    log.text = content.slice(start, end);
  }

  function hide() {
    log.hide();
  }

  function search() {
    console.log("我执行了吗");

    let quickPick = vscode.window.createQuickPick();

    quickPick.show();

    quickPick.onDidChangeValue((e) => {
      // 输入的值，应该加入防抖，
      //但是现在这个网站的搜索是直接跳到了页面，感觉没有必要搜索了，直接写死吧
      // 想看什么小说，就自己去查对应的id，然后手动加入进去反正这个也不变

      request
        .get(
          "https://www.xbiquge.so/modules/article/search.php?searchkey=" +
            encodeURIComponent(e)
        )
        .charset("gbk")
        .buffer(true)

        .end((err, res) => {
          const books = $.load(res.text);
          content = books("#content").text();
        });
    });
  }

  // 下一行
  vscode.commands.registerCommand("test-read-book-status-bar.next", () =>
    nextPage()
  );
  // 上一行
  vscode.commands.registerCommand("test-read-book-status-bar.before", () =>
    beforePage()
  );

  // 啦啦啦
  vscode.commands.registerCommand("test-read-book-status-bar.lll", () =>
    hide()
  );

  // 搜索
  vscode.commands.registerCommand("test-read-book-status-bar.search", () =>
    search()
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "drh.helloWorld",
    function () {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      // vscode.window.showInformationMessage("Hello World from drh!");
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};

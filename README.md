# 亲子游戏盒

一个按年龄、场景和类型推荐亲子游戏的纯前端网页，内容库目前有 12 款测试游戏。

**在线试玩：** https://xyhqt.github.io/parent-child-game-box/

## 仓库内容

- `docs/index.html`：页面入口
- `docs/styles.css`：响应式样式
- `docs/app.js`：筛选、随机抽取、结果、详情与收藏交互
- `docs/games.js`：游戏内容数据
- `docs/.nojekyll`：让 GitHub Pages 直接发布静态文件

GitHub Pages 已配置为从 `main` 分支的 `/docs` 目录发布。修改该目录后，Pages 会重新构建网页。

## 本地运行

```bash
python3 -m http.server 8765 --directory docs
```

浏览器打开 http://localhost:8765 。

收藏保存在各自浏览器中，清理浏览器数据或换设备后不会同步。当前版本没有账号或付费访问控制。面向更多家庭开放前，建议复核游戏的年龄适配和安全提示，并扩充内容库。

# 亲子游戏盒

按照《亲子游戏盒 PRD V1.1》实现的静态网页。`docs/` 是 GitHub Pages 发布目录。

**在线试玩：** https://xyhqt.github.io/parent-child-game-box/

## GitHub Pages

仓库 Settings → Pages → Build and deployment → Deploy from a branch，选择 `main` 分支的 `/docs` 目录，保存后即可访问 GitHub Pages 地址。

推荐仓库名：`parent-child-game-box`。本项目没有服务端、登录或付费访问控制；网页和源码发布到公开仓库后，任何知道地址的人都可以访问。

## 本地运行

```bash
python3 -m http.server 8765 --directory docs
```

浏览器打开 `http://localhost:8765`。

内容库包含 12 款测试游戏。公测前应按年龄、场景和安全要求复核并扩充内容。

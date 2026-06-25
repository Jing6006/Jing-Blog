
---

## 历史操作记录

### 2026-06-25: 博客文章不同步问题诊断与解决

**问题描述**:
用户在 `date/资源荟萃/` 目录下添加了 `claude风格前端提示词.md`，提交并推送到 GitHub，但博客 `http://39.105.9.115` 上没有显示新文章。

**诊断过程**:
1. 检查 Git 提交历史，确认文件已在 commit `2d81af8` 中提交
2. 验证本地 `content:sync` 工作正常，文件正确同步到 `source/_posts/date-347292dd6a-资源荟萃-claude风格前端提示词.md`
3. 检查 Git hooks 配置，发现 `.git/hooks/post-commit` 和 `.git/hooks/pre-push` 已正确配置
4. 推断问题出在服务器的部署脚本 `/usr/local/bin/jing-blog-deploy-archive`

**根本原因**:
服务器部署脚本可能直接执行了 `hexo generate` 而不是 `npm run build`，导致 `content:sync` 步骤被跳过，`date/` 目录下的文件没有同步到 `source/_posts/`。

**解决方案**:
1. 创建了 `scripts/verify-sync.js` 脚本，用于验证同步是否正确
2. 更新 CLAUDE.md 文档，添加完整的部署流程说明和故障排查步骤
3. 需要检查服务器脚本，确保使用 `npm run build` 而不是 `hexo generate`

**后续行动**:
- [ ] SSH 登录服务器，检查 `/usr/local/bin/jing-blog-deploy-archive` 脚本内容
- [ ] 如果脚本错误，修改为使用 `npm run build`
- [ ] 执行空提交 `git commit --allow-empty -m "Trigger redeploy"` 触发重新部署
- [ ] 验证博客是否显示新文章

**新增文件**:
- `scripts/verify-sync.js`: 验证 content:sync 是否正确执行的脚本

**文档更新**:
- `CLAUDE.md`: 添加了「重要提示」章节，要求每次操作都记录到历史
- `CLAUDE.md`: 添加了「Deployment Flow」章节，详细说明自动部署流程
- `CLAUDE.md`: 添加了「Troubleshooting」章节，说明文章不同步问题的诊断方法
- `CLAUDE.md`: 添加了「Manual Server Deployment」章节，说明手动部署步骤

**关键命令**:
```bash
# 验证本地同步
npm run content:sync
node scripts/verify-sync.js

# 检查服务器部署脚本
ssh root@39.105.9.115 "cat /usr/local/bin/jing-blog-deploy-archive"

# 触发重新部署
git commit --allow-empty -m "Trigger redeploy"
```

**经验教训**:
1. Git hooks 在 commit 时就会触发部署，不需要 push 到 GitHub
2. 服务器部署脚本必须使用 `npm run build` 而不是 `hexo generate`
3. `npm run build` = `npm run content:sync` + `hexo generate`，缺一不可
4. 本地 `content:sync` 正常不代表服务器也正常，需要验证服务器脚本

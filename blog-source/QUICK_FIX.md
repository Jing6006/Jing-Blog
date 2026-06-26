## 博客文章不显示问题 - 快速修复指南

### 问题
你添加了 `claude风格前端提示词.md`，但博客没有显示。

### 原因
该文件缺少 YAML frontmatter，导致 Hexo 构建失败。

### 修复步骤

1. **关闭 Typora**：
   - 关闭所有打开的 `claude风格前端提示词.md` 窗口

2. **替换文件**：
   ```bash
   # 删除原文件
   rm "date/资源荟萃/claude风格前端提示词.md"
   
   # 重命名修复版本
   mv "date/资源荟萃/claude风格前端提示词-fixed.md" "date/资源荟萃/claude风格前端提示词.md"
   ```

3. **提交并部署**：
   ```bash
   git add .
   git commit -m "修复 claude风格前端提示词 frontmatter"
   git push
   ```

4. **验证**：
   - 等待几秒钟让 Git hook 触发部署
   - 访问 http://39.105.9.115 查看文章是否出现

### 或者使用 PowerShell（Windows）

```powershell
# 关闭 Typora 后执行
Remove-Item "date\资源荟萃\claude风格前端提示词.md"
Move-Item "date\资源荟萃\claude风格前端提示词-fixed.md" "date\资源荟萃\claude风格前端提示词.md"
git add .
git commit -m "修复 claude风格前端提示词 frontmatter"
git push
```

### 关键点

- **所有 Markdown 文件都必须有 frontmatter**
- Frontmatter 格式：
  ```yaml
  ---
  title: 文章标题
  date: 2026-05-18 00:38:00
  tags:
    - 标签1
  categories:
    - 分类名
  description: 文章摘要
  ---
  ```
- 如果文件没有 frontmatter，sync-content.js 会尝试自动生成，但可能出错

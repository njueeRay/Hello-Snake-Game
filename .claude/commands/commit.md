准备提交代码，请执行以下流程：

1. 运行 `git status` 查看改动文件列表
2. 运行 `git diff` 查看具体改动
3. 分析改动内容，起草一个简洁的 commit message：
   - 格式：`类型(范围): 描述`
   - 类型：feat / fix / refactor / style / docs / chore
   - 示例：`feat(snake): 添加碰撞检测逻辑`
4. 执行 `git add .` 暂存所有改动
5. 执行 git commit，commit message 末尾附上：
   `Co-Authored-By: Claude <noreply@anthropic.com>`
6. 输出最终 commit hash 和完整 commit message

注意：不要 push，只 commit 到本地。
